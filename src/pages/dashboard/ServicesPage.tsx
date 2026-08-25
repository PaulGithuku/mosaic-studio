import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { studioService } from '../../services/studioService';
import { Service } from '../../types/phase2';
import { ServicesGridSkeleton } from '../../components/ui/Skeletons';
import {
  Sparkles,
  Plus,
  Clock,
  DollarSign,
  Tag,
  Star,
  Edit2,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF'] as const;

const DURATION_PRESETS = [
  { label: '30 Minutes', value: 30 },
  { label: '1 Hour', value: 60 },
  { label: '90 Minutes', value: 90 },
  { label: '2 Hours', value: 120 },
  { label: '3 Hours', value: 180 },
  { label: 'Half Day (4h)', value: 240 },
  { label: 'Full Day (8h)', value: 480 },
];

export const ServicesPage: React.FC = () => {
  const { photographer } = useAuth();
  const { addToast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal State (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [category, setCategory] = useState('');
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);

  // Delete state
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await studioService.getServices();
      setServices(data);
    } catch (err) {
      addToast('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openCreateModal = () => {
    setEditingServiceId(null);
    setName('');
    setDescription('');
    setPrice('');
    setCurrency('USD');
    setDurationMinutes(60);
    setCategory('Editorial');
    setFeatured(false);
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingServiceId(service.id);
    setName(service.name);
    setDescription(service.description || '');
    setPrice(service.price);
    setCurrency(service.currency || 'USD');
    setDurationMinutes(service.duration_minutes);
    setCategory(service.category || 'Editorial');
    setFeatured(service.featured);
    setActive(service.active);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      addToast('Service name is required', 'error');
      return;
    }

    if (price === '' || isNaN(Number(price)) || Number(price) < 0) {
      addToast('Please enter a valid non-negative price', 'error');
      return;
    }

    if (!durationMinutes || durationMinutes <= 0) {
      addToast('Please select a valid service duration', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (editingServiceId) {
        const updated = await studioService.updateService(editingServiceId, {
          name: name.trim(),
          description: description.trim() || null,
          price: Number(price),
          currency,
          duration_minutes: durationMinutes,
          category: category.trim() || null,
          featured,
          active,
        });
        setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        addToast('Service updated successfully', 'success');
      } else {
        const created = await studioService.createService({
          name: name.trim(),
          description: description.trim() || null,
          price: Number(price),
          currency,
          duration_minutes: durationMinutes,
          category: category.trim() || null,
          featured,
          active,
          display_order: services.length,
        });
        setServices((prev) => [...prev, created]);
        addToast('New service package created', 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save service';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const updated = await studioService.updateService(service.id, {
        active: !service.active,
      });
      setServices((prev) => prev.map((s) => (s.id === service.id ? updated : s)));
      addToast(
        updated.active ? `Service "${service.name}" activated` : `Service "${service.name}" deactivated`,
        'info'
      );
    } catch (err) {
      addToast('Failed to toggle service status', 'error');
    }
  };

  const handleToggleFeatured = async (service: Service) => {
    try {
      const updated = await studioService.updateService(service.id, {
        featured: !service.featured,
      });
      setServices((prev) => prev.map((s) => (s.id === service.id ? updated : s)));
      addToast(
        updated.featured ? 'Marked as signature featured offering' : 'Removed from signature highlights',
        'info'
      );
    } catch (err) {
      addToast('Failed to update featured status', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    try {
      setDeleting(true);
      await studioService.deleteService(serviceToDelete.id);
      setServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id));
      addToast('Service deleted', 'success');
      setServiceToDelete(null);
    } catch (err) {
      addToast('Failed to delete service', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Format Duration display
  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} mins`;
    const hours = mins / 60;
    return Number.isInteger(hours) ? `${hours} hr${hours > 1 ? 's' : ''}` : `${hours.toFixed(1)} hrs`;
  };

  // Categories list extracted from existing services
  const uniqueCategories = Array.from(
    new Set(services.map((s) => s.category).filter(Boolean))
  ) as string[];

  const filteredServices = services.filter((s) => {
    if (categoryFilter === 'all') return true;
    return s.category === categoryFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1A1A1A] pb-6">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl text-[#F7F5F0] font-light">
            Services & Commissions
          </h1>
          <p className="text-sm text-[#8E8E8E] mt-1">
            Define editorial packages, bespoke commissions, session durations, and client pricing tiers.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C9A86A] hover:bg-[#B89758] text-[#0B0B0B] text-xs font-mono uppercase tracking-widest font-semibold rounded-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service Package</span>
        </button>
      </div>

      {/* Filter Tabs */}
      {uniqueCategories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-[#111111] p-2 border border-[#1F1F1F] rounded-sm">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors ${
              categoryFilter === 'all'
                ? 'bg-[#C9A86A] text-[#0B0B0B] font-semibold'
                : 'bg-[#181818] text-[#888888] hover:text-[#E0E0E0]'
            }`}
          >
            All Packages ({services.length})
          </button>
          {uniqueCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#C9A86A] text-[#0B0B0B] font-semibold'
                  : 'bg-[#181818] text-[#888888] hover:text-[#E0E0E0]'
              }`}
            >
              {cat} ({services.filter((s) => s.category === cat).length})
            </button>
          ))}
        </div>
      )}

      {/* Services List Grid */}
      {loading ? (
        <ServicesGridSkeleton />
      ) : filteredServices.length === 0 ? (
        <div className="py-20 px-4 text-center bg-[#101010] border border-dashed border-[#222222] rounded-sm">
          <div className="w-12 h-12 rounded-full bg-[#181818] border border-[#2B2B2B] flex items-center justify-center mx-auto text-[#555555] mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-serif text-[#F7F5F0]">No Services Created</h3>
          <p className="text-xs text-[#777777] max-w-sm mx-auto mt-1 mb-6">
            Create your photography packages with custom pricing and duration to start receiving client commissions.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#252525] text-[#C9A86A] text-xs font-mono uppercase tracking-wider border border-[#333333] rounded-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Package</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`bg-[#121212] border rounded-sm p-6 flex flex-col justify-between transition-all relative ${
                service.active ? 'border-[#222222] hover:border-[#383838]' : 'border-[#1A1A1A] opacity-60'
              }`}
            >
              <div>
                {/* Badges Bar */}
                <div className="flex items-center justify-between mb-4">
                  {service.category ? (
                    <span className="px-2.5 py-0.5 bg-[#181818] border border-[#2B2B2B] text-[#C9A86A] text-[11px] font-mono uppercase tracking-wider rounded-sm">
                      {service.category}
                    </span>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(service)}
                      className={`p-1.5 rounded-sm transition-colors ${
                        service.featured
                          ? 'bg-[#C9A86A]/20 text-[#C9A86A]'
                          : 'bg-[#181818] text-[#555555] hover:text-[#C9A86A]'
                      }`}
                      title={service.featured ? 'Signature offering' : 'Mark as signature'}
                    >
                      <Star className={`w-3.5 h-3.5 ${service.featured ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(service)}
                      className={`p-1.5 rounded-sm transition-colors ${
                        service.active
                          ? 'bg-[#181818] text-[#888888] hover:text-[#F7F5F0]'
                          : 'bg-[#281515] text-[#E06A6A]'
                      }`}
                      title={service.active ? 'Active on booking calendar' : 'Deactivated'}
                    >
                      {service.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Service Title */}
                <h3 className="font-serif text-lg text-[#F7F5F0] mb-2 font-normal">
                  {service.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-[#8E8E8E] leading-relaxed line-clamp-3 mb-4">
                  {service.description || 'No detailed description provided.'}
                </p>
              </div>

              {/* Price & Duration Bar */}
              <div className="pt-4 border-t border-[#1C1C1C] flex items-center justify-between">
                <div>
                  <div className="text-lg font-mono font-medium text-[#C9A86A]">
                    {service.currency} {Number(service.price).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-[#666666] mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(service.duration_minutes)}</span>
                  </div>
                </div>

                {/* Edit & Delete Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(service)}
                    className="p-2 bg-[#181818] hover:bg-[#222222] text-[#AAAAAA] hover:text-[#C9A86A] border border-[#2B2B2B] rounded-sm transition-colors"
                    title="Edit Service"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceToDelete(service)}
                    className="p-2 bg-[#181818] hover:bg-[#281515] text-[#AAAAAA] hover:text-[#FF6666] border border-[#2B2B2B] rounded-sm transition-colors"
                    title="Delete Service"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Create / Edit Service Modal */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121212] border border-[#2B2B2B] w-full max-w-lg rounded-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#1E1E1E] flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#F7F5F0] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9A86A]" />
                <span>{editingServiceId ? 'Edit Photography Package' : 'Create Photography Package'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#777777] hover:text-[#F7F5F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Service Name */}
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-1.5">
                  Package / Service Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Editorial Portrait Session (Studio & Location)"
                  className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-3.5 py-2.5 outline-none rounded-sm placeholder-[#444444]"
                />
              </div>

              {/* Price & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-1.5">
                    Price *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    required
                    placeholder="850.00"
                    className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-3.5 py-2.5 outline-none rounded-sm font-mono placeholder-[#444444]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-1.5">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-3.5 py-2.5 outline-none rounded-sm font-mono"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-1.5">
                    Duration
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                    className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-3.5 py-2.5 outline-none rounded-sm font-mono"
                  >
                    {DURATION_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-1.5">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Editorial, Portrait, Wedding"
                    className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-3.5 py-2.5 outline-none rounded-sm placeholder-[#444444]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-1.5">
                  Package Deliverables & Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Includes 15 retouched editorial portraits, private online gallery, usage licensing..."
                  className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm p-3.5 outline-none rounded-sm placeholder-[#444444] resize-y"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-3 p-3 bg-[#161616] border border-[#252525] rounded-sm cursor-pointer hover:border-[#383838]">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="accent-[#C9A86A] w-4 h-4 rounded"
                  />
                  <span className="text-xs font-mono uppercase text-[#F7F5F0] flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-[#C9A86A]" />
                    <span>Signature Package</span>
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-[#161616] border border-[#252525] rounded-sm cursor-pointer hover:border-[#383838]">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="accent-[#C9A86A] w-4 h-4 rounded"
                  />
                  <span className="text-xs font-mono uppercase text-[#F7F5F0] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#6AE08B]" />
                    <span>Active for Booking</span>
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E1E1E]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono uppercase text-[#888888] hover:text-[#F7F5F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C9A86A] hover:bg-[#B89758] text-[#0B0B0B] text-xs font-mono uppercase tracking-widest font-semibold rounded-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Package...</span>
                    </>
                  ) : (
                    <span>{editingServiceId ? 'Save Changes' : 'Create Package'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Delete Confirmation Modal */}
      {/* ========================================================================= */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#331111] max-w-md w-full p-6 rounded-sm space-y-4">
            <h3 className="font-serif text-lg text-[#F7F5F0] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#E06A6A]" />
              <span>Confirm Deletion</span>
            </h3>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-[#F7F5F0]">{serviceToDelete.name}</strong>?
              This service will be removed from your studio menu.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="px-4 py-2 text-xs font-mono uppercase text-[#888888] hover:text-[#F7F5F0]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B1E1E] hover:bg-[#A32222] text-[#F7F5F0] text-xs font-mono uppercase tracking-wider rounded-sm disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
