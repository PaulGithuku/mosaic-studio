import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { studioService } from '../../services/studioService';
import {
  User,
  Camera,
  Upload,
  Trash2,
  Globe,
  Instagram,
  Facebook,
  Phone,
  Mail,
  MapPin,
  Award,
  Sparkles,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Loader2,
} from 'lucide-react';

const POPULAR_SPECIALTIES = [
  'Portrait',
  'Editorial',
  'Fashion',
  'Commercial',
  'Wedding',
  'Architecture',
  'Documentary',
  'Fine Art',
  'Street',
  'Automotive',
  'Product',
  'Event',
];

export const ProfilePage: React.FC = () => {
  const { photographer, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: photographer?.name || '',
    slug: photographer?.slug || '',
    bio: photographer?.bio || '',
    location: photographer?.location || '',
    phone: photographer?.phone || '',
    website: photographer?.website || '',
    instagram: photographer?.instagram || '',
    facebook: photographer?.facebook || '',
    tiktok: photographer?.tiktok || '',
    whatsapp: photographer?.whatsapp || '',
    years_experience: photographer?.years_experience || 0,
    specialties: photographer?.specialties || ['Portrait', 'Editorial'],
  });

  const [customSpecialtyInput, setCustomSpecialtyInput] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    photographer?.profile_image_path || null
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'years_experience' ? (parseInt(value, 10) || 0) : value,
    }));
  };

  const handleToggleSpecialty = (specialty: string) => {
    setFormData((prev) => {
      const exists = prev.specialties.includes(specialty);
      if (exists) {
        return { ...prev, specialties: prev.specialties.filter((s) => s !== specialty) };
      } else {
        if (prev.specialties.length >= 10) {
          addToast('Maximum 10 specialties allowed', 'warning');
          return prev;
        }
        return { ...prev, specialties: [...prev.specialties, specialty] };
      }
    });
  };

  const handleAddCustomSpecialty = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customSpecialtyInput.trim();
    if (!clean) return;
    if (formData.specialties.includes(clean)) {
      addToast('Specialty already added', 'warning');
      return;
    }
    if (formData.specialties.length >= 10) {
      addToast('Maximum 10 specialties allowed', 'warning');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      specialties: [...prev.specialties, clean],
    }));
    setCustomSpecialtyInput('');
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (JPEG, PNG, WebP, AVIF)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast('Image file exceeds the 10MB limit', 'error');
      return;
    }

    try {
      setUploadingAvatar(true);
      const res = await studioService.uploadAvatar(file);
      setAvatarPreview(res.profile_image_path);
      await refreshUser();
      addToast('Studio portrait updated successfully', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to upload studio avatar';
      addToast(msg, 'error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true);
      await studioService.removeAvatar();
      setAvatarPreview(null);
      await refreshUser();
      addToast('Studio avatar removed', 'info');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to remove avatar';
      addToast(msg, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      addToast('Studio or photographer name is required', 'error');
      return;
    }

    const cleanSlug = formData.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanSlug) {
      addToast('A valid studio URL slug is required', 'error');
      return;
    }

    try {
      setSaving(true);
      await studioService.updateProfile({
        ...formData,
        slug: cleanSlug,
      });
      await refreshUser();
      addToast('Profile changes saved successfully', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save profile changes';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1A1A1A] pb-6">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl text-[#F7F5F0] font-light">
            Studio Profile
          </h1>
          <p className="text-sm text-[#8E8E8E] mt-1">
            Manage your public identity, editorial bio, contact coordinates, and specialties.
          </p>
        </div>
        {photographer?.slug && (
          <a
            href={`/p/${photographer.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#161616] hover:bg-[#202020] text-[#C9A86A] text-xs uppercase tracking-wider font-mono border border-[#333333] transition-colors rounded-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Studio</span>
          </a>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Portrait & Core Identity */}
        <div className="bg-[#121212] border border-[#1F1F1F] p-6 lg:p-8 rounded-sm space-y-6">
          <h2 className="text-xs uppercase font-mono tracking-widest text-[#C9A86A] flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            <span>Visual Identity & Avatar</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#181818] border-2 border-[#2E2E2E] overflow-hidden flex items-center justify-center text-[#555555]">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={formData.name || 'Photographer portrait'}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarPreview(null)}
                  />
                ) : (
                  <Camera className="w-8 h-8 text-[#444444]" />
                )}
              </div>

              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center text-[#C9A86A]">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileSelect}
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1A1A1A] hover:bg-[#252525] text-[#F7F5F0] text-xs font-mono uppercase tracking-wider border border-[#333333] transition-colors rounded-sm disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5 text-[#C9A86A]" />
                  <span>Upload Portrait</span>
                </button>

                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1A1414] hover:bg-[#281818] text-[#E06A6A] text-xs font-mono uppercase tracking-wider border border-[#442222] transition-colors rounded-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-[#777777]">
                Supported: JPEG, PNG, WebP, AVIF up to 10MB. Recommended square aspect ratio (800x800).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#1A1A1A]">
            {/* Studio / Photographer Name */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-2">
                Studio / Artist Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g. Julian Bennett Studio"
                className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-4 py-2.5 outline-none transition-colors rounded-sm placeholder-[#444444]"
              />
            </div>

            {/* Public Slug */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-2">
                Studio URL Slug *
              </label>
              <div className="flex items-center">
                <span className="bg-[#181818] border border-r-0 border-[#2B2B2B] text-[#666666] text-xs font-mono px-3 py-2.5 rounded-l-sm select-none">
                  mosaic.studio/
                </span>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  placeholder="julian-bennett"
                  className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-4 py-2.5 outline-none transition-colors rounded-r-sm font-mono placeholder-[#444444]"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C9A86A]" />
                <span>Primary Location / Base</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g. London, United Kingdom & Milan, Italy"
                className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-4 py-2.5 outline-none transition-colors rounded-sm placeholder-[#444444]"
              />
            </div>

            {/* Years Experience */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#C9A86A]" />
                <span>Years of Professional Experience</span>
              </label>
              <input
                type="number"
                name="years_experience"
                min="0"
                max="80"
                value={formData.years_experience}
                onChange={handleInputChange}
                className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-4 py-2.5 outline-none transition-colors rounded-sm"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-2">
              Editorial Biography & Artist Statement
            </label>
            <textarea
              name="bio"
              rows={4}
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell clients about your aesthetic, philosophy, lighting techniques, and notable publications..."
              className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm p-4 outline-none transition-colors rounded-sm placeholder-[#444444] resize-y"
            />
            <span className="text-[11px] text-[#666666] font-mono block mt-1">
              {formData.bio?.length || 0} / 2000 characters
            </span>
          </div>
        </div>

        {/* Section 2: Photography Specialties */}
        <div className="bg-[#121212] border border-[#1F1F1F] p-6 lg:p-8 rounded-sm space-y-6">
          <h2 className="text-xs uppercase font-mono tracking-widest text-[#C9A86A] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Photography Specialties & Disciplines</span>
          </h2>
          <p className="text-xs text-[#8E8E8E]">
            Select the genres and photographic styles that represent your primary client commissions.
          </p>

          <div className="flex flex-wrap gap-2.5">
            {POPULAR_SPECIALTIES.map((spec) => {
              const isSelected = formData.specialties.includes(spec);
              return (
                <button
                  type="button"
                  key={spec}
                  onClick={() => handleToggleSpecialty(spec)}
                  className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm transition-all border ${
                    isSelected
                      ? 'bg-[#C9A86A]/15 border-[#C9A86A] text-[#E5CA92]'
                      : 'bg-[#161616] border-[#2B2B2B] text-[#888888] hover:border-[#444444] hover:text-[#D0D0D0]'
                  }`}
                >
                  {isSelected ? '✓ ' : '+ '}
                  {spec}
                </button>
              );
            })}
          </div>

          {/* Custom Specialty input */}
          <div className="pt-3 flex items-center gap-3">
            <input
              type="text"
              value={customSpecialtyInput}
              onChange={(e) => setCustomSpecialtyInput(e.target.value)}
              placeholder="Add custom discipline (e.g. Drone, Aerial)..."
              className="bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-xs px-3.5 py-2 outline-none rounded-sm placeholder-[#444444] w-64 font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSpecialty(e);
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddCustomSpecialty}
              className="px-3 py-2 bg-[#1A1A1A] hover:bg-[#252525] text-[#C9A86A] text-xs font-mono uppercase border border-[#333333] rounded-sm transition-colors"
            >
              Add
            </button>
          </div>

          {/* Active selection chips */}
          {formData.specialties.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#666666] font-mono">Active tags:</span>
              {formData.specialties.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#181818] border border-[#333333] text-[#E0E0E0] text-xs font-mono rounded-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleToggleSpecialty(tag)}
                    className="text-[#888888] hover:text-[#FF6666]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Contact & Social Coordinates */}
        <div className="bg-[#121212] border border-[#1F1F1F] p-6 lg:p-8 rounded-sm space-y-6">
          <h2 className="text-xs uppercase font-mono tracking-widest text-[#C9A86A] flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" />
            <span>Contact & Social Channels</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#C9A86A]" />
                <span>Phone / Direct Line</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+44 20 7946 0991"
                className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-4 py-2.5 outline-none transition-colors rounded-sm placeholder-[#444444]"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-2 flex items-center gap-1.5">
                <span className="text-[#C9A86A] font-bold text-xs">WA</span>
                <span>WhatsApp Business</span>
              </label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                placeholder="+44 7700 900077"
                className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-4 py-2.5 outline-none transition-colors rounded-sm placeholder-[#444444]"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#C9A86A]" />
                <span>Personal Website</span>
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://julianbennett.co.uk"
                className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-4 py-2.5 outline-none transition-colors rounded-sm placeholder-[#444444]"
              />
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-2 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-[#C9A86A]" />
                <span>Instagram Handle</span>
              </label>
              <div className="flex items-center">
                <span className="bg-[#181818] border border-r-0 border-[#2B2B2B] text-[#666666] text-xs font-mono px-3 py-2.5 rounded-l-sm">
                  @
                </span>
                <input
                  type="text"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  placeholder="julianbennett.photo"
                  className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-4 py-2.5 outline-none transition-colors rounded-r-sm placeholder-[#444444]"
                />
              </div>
            </div>

            {/* Facebook */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-2 flex items-center gap-1.5">
                <Facebook className="w-3.5 h-3.5 text-[#C9A86A]" />
                <span>Facebook Page</span>
              </label>
              <input
                type="text"
                name="facebook"
                value={formData.facebook}
                onChange={handleInputChange}
                placeholder="julianbennettphoto"
                className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-4 py-2.5 outline-none transition-colors rounded-sm placeholder-[#444444]"
              />
            </div>

            {/* TikTok */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-2">
                TikTok Handle
              </label>
              <div className="flex items-center">
                <span className="bg-[#181818] border border-r-0 border-[#2B2B2B] text-[#666666] text-xs font-mono px-3 py-2.5 rounded-l-sm">
                  @
                </span>
                <input
                  type="text"
                  name="tiktok"
                  value={formData.tiktok}
                  onChange={handleInputChange}
                  placeholder="julianstudio"
                  className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-4 py-2.5 outline-none transition-colors rounded-r-sm placeholder-[#444444]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A86A] hover:bg-[#B89758] text-[#0B0B0B] text-xs font-mono uppercase tracking-widest font-semibold transition-colors rounded-sm disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Studio Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
