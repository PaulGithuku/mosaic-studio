import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { studioService } from '../../services/studioService';
import { Category, PortfolioImage } from '../../types/phase2';
import { PortfolioGridSkeleton } from '../../components/ui/Skeletons';
import {
  Image as ImageIcon,
  Plus,
  Upload,
  Star,
  Trash2,
  Edit2,
  FolderPlus,
  SlidersHorizontal,
  Eye,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Loader2,
  Layers,
  Sparkles,
  AlertCircle,
  Maximize2,
} from 'lucide-react';

export const PortfolioPage: React.FC = () => {
  const { photographer } = useAuth();
  const { addToast } = useToast();

  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [filterFeaturedOnly, setFilterFeaturedOnly] = useState(false);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategoryId, setUploadCategoryId] = useState<string>('');
  const [uploadFeatured, setUploadFeatured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Metadata Modal State
  const [editingImage, setEditingImage] = useState<PortfolioImage | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [editFeatured, setEditFeatured] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Category Manager Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  // Lightbox Preview Modal State
  const [previewImage, setPreviewImage] = useState<PortfolioImage | null>(null);

  // Delete Confirmation State
  const [imageToDelete, setImageToDelete] = useState<PortfolioImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [imgs, cats] = await Promise.all([
        studioService.getPortfolioImages(),
        studioService.getCategories(),
      ]);
      setImages(imgs);
      setCategories(cats);
    } catch (err: any) {
      addToast('Failed to load portfolio items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Images
  const filteredImages = images.filter((img) => {
    if (filterFeaturedOnly && !img.featured) return false;
    if (activeCategoryFilter === 'all') return true;
    if (activeCategoryFilter === 'uncategorized') return !img.category_id;
    return img.category_id === activeCategoryFilter;
  });

  // Handle File Drag & Drop
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessSelectedFile(file);
  };

  const handleProcessSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (JPEG, PNG, WebP, AVIF)', 'error');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      addToast('File size exceeds the 15MB limit', 'error');
      return;
    }
    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      addToast('Please select an image file to upload', 'error');
      return;
    }

    try {
      setUploading(true);
      const newImg = await studioService.uploadPortfolioImage(uploadFile, {
        title: uploadTitle.trim() || undefined,
        description: uploadDescription.trim() || undefined,
        category_id: uploadCategoryId || null,
        featured: uploadFeatured,
      });

      setImages((prev) => [newImg, ...prev]);
      addToast('Portfolio photograph uploaded successfully', 'success');
      // Reset
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadPreview(null);
      setUploadTitle('');
      setUploadDescription('');
      setUploadCategoryId('');
      setUploadFeatured(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to upload photograph';
      addToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Open Edit Metadata Modal
  const handleOpenEditModal = (img: PortfolioImage) => {
    setEditingImage(img);
    setEditTitle(img.title || '');
    setEditDescription(img.description || '');
    setEditCategoryId(img.category_id || '');
    setEditFeatured(img.featured);
  };

  // Save Metadata Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage) return;

    try {
      setSavingEdit(true);
      const updated = await studioService.updatePortfolioImage(editingImage.id, {
        title: editTitle.trim() || null,
        description: editDescription.trim() || null,
        category_id: editCategoryId || null,
        featured: editFeatured,
      });

      setImages((prev) =>
        prev.map((img) => (img.id === updated.id ? { ...img, ...updated } : img))
      );
      addToast('Image metadata updated', 'success');
      setEditingImage(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update image metadata';
      addToast(msg, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Toggle Featured status directly
  const handleToggleFeatured = async (img: PortfolioImage, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await studioService.updatePortfolioImage(img.id, {
        featured: !img.featured,
      });
      setImages((prev) =>
        prev.map((item) => (item.id === img.id ? { ...item, featured: updated.featured } : item))
      );
      addToast(
        updated.featured ? 'Marked as featured hero image' : 'Removed from featured highlights',
        'info'
      );
    } catch (err: any) {
      addToast('Failed to update featured status', 'error');
    }
  };

  // Delete Image
  const handleConfirmDeleteImage = async () => {
    if (!imageToDelete) return;
    try {
      setDeleting(true);
      await studioService.deletePortfolioImage(imageToDelete.id);
      setImages((prev) => prev.filter((img) => img.id !== imageToDelete.id));
      addToast('Photograph removed from portfolio', 'success');
      setImageToDelete(null);
    } catch (err: any) {
      addToast('Failed to delete portfolio image', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Reorder Images (Move Up / Move Down)
  const handleMoveImage = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredImages.length) return;

    const newOrder = [...images];
    const sourceItem = filteredImages[index];
    const targetItem = filteredImages[targetIndex];

    const sourceIdx = newOrder.findIndex((i) => i.id === sourceItem.id);
    const targetIdx = newOrder.findIndex((i) => i.id === targetItem.id);

    if (sourceIdx === -1 || targetIdx === -1) return;

    const temp = newOrder[sourceIdx];
    newOrder[sourceIdx] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;

    setImages(newOrder);

    try {
      await studioService.reorderPortfolioImages(newOrder.map((i) => i.id));
      addToast('Portfolio order updated', 'success');
    } catch (err) {
      addToast('Failed to save reordered list', 'error');
      loadData();
    }
  };

  // Category Actions
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setCategorySubmitting(true);
      const newCat = await studioService.createCategory({
        name: newCategoryName.trim(),
      });
      setCategories((prev) => [...prev, newCat]);
      setNewCategoryName('');
      addToast(`Category "${newCat.name}" created`, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create category';
      addToast(msg, 'error');
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingCatName.trim()) return;
    try {
      setCategorySubmitting(true);
      const updated = await studioService.updateCategory(id, { name: editingCatName.trim() });
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingCatId(null);
      setEditingCatName('');
      addToast('Category renamed', 'success');
    } catch (err: any) {
      addToast('Failed to rename category', 'error');
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleToggleCategoryActive = async (cat: Category) => {
    try {
      const updated = await studioService.updateCategory(cat.id, { active: !cat.active });
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? updated : c)));
      addToast(
        updated.active ? `Category "${cat.name}" enabled` : `Category "${cat.name}" hidden`,
        'info'
      );
    } catch (err) {
      addToast('Failed to update category status', 'error');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"? Images in this category will become uncategorized.`)) {
      return;
    }
    try {
      await studioService.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (activeCategoryFilter === id) setActiveCategoryFilter('all');
      // Reload images to update category references
      loadData();
      addToast(`Category "${name}" deleted`, 'info');
    } catch (err: any) {
      addToast('Failed to delete category', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1A1A1A] pb-6">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl text-[#F7F5F0] font-light">
            Portfolio Gallery
          </h1>
          <p className="text-sm text-[#8E8E8E] mt-1">
            Curate high-resolution works, organize editorial categories, and highlight featured masterpieces.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#161616] hover:bg-[#202020] text-[#D0D0D0] text-xs font-mono uppercase tracking-wider border border-[#2E2E2E] rounded-sm transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[#C9A86A]" />
            <span>Manage Categories ({categories.length})</span>
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C9A86A] hover:bg-[#B89758] text-[#0B0B0B] text-xs font-mono uppercase tracking-widest font-semibold rounded-sm transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photograph</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Quick Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] p-3 border border-[#1F1F1F] rounded-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors shrink-0 ${
              activeCategoryFilter === 'all'
                ? 'bg-[#C9A86A] text-[#0B0B0B] font-semibold'
                : 'bg-[#181818] text-[#888888] hover:text-[#E0E0E0]'
            }`}
          >
            All Works ({images.length})
          </button>

          {categories.map((cat) => {
            const count = images.filter((img) => img.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors shrink-0 flex items-center gap-1.5 ${
                  activeCategoryFilter === cat.id
                    ? 'bg-[#C9A86A] text-[#0B0B0B] font-semibold'
                    : 'bg-[#181818] text-[#888888] hover:text-[#E0E0E0]'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}

          <button
            onClick={() => setActiveCategoryFilter('uncategorized')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors shrink-0 ${
              activeCategoryFilter === 'uncategorized'
                ? 'bg-[#C9A86A] text-[#0B0B0B] font-semibold'
                : 'bg-[#181818] text-[#888888] hover:text-[#E0E0E0]'
            }`}
          >
            Uncategorized ({images.filter((i) => !i.category_id).length})
          </button>
        </div>

        {/* Featured Filter Toggle */}
        <button
          onClick={() => setFilterFeaturedOnly((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm border transition-colors shrink-0 ${
            filterFeaturedOnly
              ? 'bg-[#C9A86A]/20 border-[#C9A86A] text-[#E5CA92]'
              : 'bg-[#161616] border-[#2E2E2E] text-[#777777] hover:text-[#C9A86A]'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${filterFeaturedOnly ? 'fill-[#C9A86A]' : ''}`} />
          <span>Featured Only</span>
        </button>
      </div>

      {/* Main Gallery Grid */}
      {loading ? (
        <PortfolioGridSkeleton />
      ) : filteredImages.length === 0 ? (
        <div className="py-20 px-4 text-center bg-[#101010] border border-dashed border-[#222222] rounded-sm">
          <div className="w-12 h-12 rounded-full bg-[#181818] border border-[#2B2B2B] flex items-center justify-center mx-auto text-[#555555] mb-4">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-serif text-[#F7F5F0]">No Photographs in this View</h3>
          <p className="text-xs text-[#777777] max-w-sm mx-auto mt-1 mb-6">
            {filterFeaturedOnly
              ? 'No images have been marked as featured highlights yet.'
              : 'Upload high-resolution photography works to populate this collection.'}
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#252525] text-[#C9A86A] text-xs font-mono uppercase tracking-wider border border-[#333333] rounded-sm transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload First Photograph</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((img, index) => {
            const catName = categories.find((c) => c.id === img.category_id)?.name;
            return (
              <div
                key={img.id}
                className="group relative bg-[#121212] border border-[#1F1F1F] hover:border-[#383838] transition-all rounded-sm overflow-hidden flex flex-col"
              >
                {/* Image Container */}
                <div
                  onClick={() => setPreviewImage(img)}
                  className="aspect-[4/5] bg-[#0E0E0E] relative overflow-hidden cursor-pointer"
                >
                  <img
                    src={img.public_url}
                    alt={img.title || 'Portfolio work'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    {catName ? (
                      <span className="px-2 py-0.5 bg-black/75 backdrop-blur-sm border border-[#333333] text-[10px] font-mono text-[#C9A86A] uppercase tracking-wider rounded-sm">
                        {catName}
                      </span>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleToggleFeatured(img, e)}
                      className={`p-1.5 rounded-sm backdrop-blur-sm transition-colors pointer-events-auto ${
                        img.featured
                          ? 'bg-[#C9A86A] text-[#0B0B0B]'
                          : 'bg-black/60 text-[#888888] hover:text-[#C9A86A]'
                      }`}
                      title={img.featured ? 'Featured hero image' : 'Mark as featured'}
                    >
                      <Star className={`w-3.5 h-3.5 ${img.featured ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Quick Action Bar on Hover */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                    <div className="flex items-center gap-1 bg-black/80 backdrop-blur-sm p-1 rounded-sm border border-[#333333]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveImage(index, 'up');
                        }}
                        disabled={index === 0}
                        className="p-1 text-[#AAAAAA] hover:text-[#F7F5F0] disabled:opacity-30"
                        title="Move Earlier"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveImage(index, 'down');
                        }}
                        disabled={index === filteredImages.length - 1}
                        className="p-1 text-[#AAAAAA] hover:text-[#F7F5F0] disabled:opacity-30"
                        title="Move Later"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 bg-black/80 backdrop-blur-sm p-1 rounded-sm border border-[#333333]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(img);
                        }}
                        className="p-1 text-[#AAAAAA] hover:text-[#C9A86A]"
                        title="Full View"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(img);
                        }}
                        className="p-1 text-[#AAAAAA] hover:text-[#C9A86A]"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageToDelete(img);
                        }}
                        className="p-1 text-[#AAAAAA] hover:text-[#FF6666]"
                        title="Delete Photograph"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Metadata Footer */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-serif text-[#F7F5F0] truncate">
                      {img.title || 'Untitled Photograph'}
                    </h4>
                    {img.description && (
                      <p className="text-xs text-[#777777] line-clamp-1 mt-0.5">
                        {img.description}
                      </p>
                    )}
                  </div>
                  <div className="pt-2 mt-2 border-t border-[#1A1A1A] flex items-center justify-between text-[11px] font-mono text-[#555555]">
                    <span>#{index + 1}</span>
                    <span>{new Date(img.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Upload Modal */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121212] border border-[#2B2B2B] w-full max-w-lg rounded-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#1E1E1E] flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#F7F5F0] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#C9A86A]" />
                <span>Upload Photograph</span>
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-[#777777] hover:text-[#F7F5F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-5">
              {/* File Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-colors ${
                  uploadPreview
                    ? 'border-[#C9A86A]/40 bg-[#161616]'
                    : 'border-[#2E2E2E] hover:border-[#444444] bg-[#141414]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProcessSelectedFile(file);
                  }}
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                />

                {uploadPreview ? (
                  <div className="relative max-h-48 flex items-center justify-center overflow-hidden">
                    <img
                      src={uploadPreview}
                      alt="Upload preview"
                      className="max-h-48 max-w-full object-contain rounded-sm"
                    />
                    <div className="absolute inset-0 bg-black/40 hover:bg-black/60 transition-colors flex items-center justify-center text-xs font-mono text-[#F7F5F0]">
                      Click or drop to replace
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#1C1C1C] border border-[#2B2B2B] flex items-center justify-center mx-auto text-[#C9A86A]">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-mono text-[#CCCCCC]">
                      Drag and drop image here or click to browse
                    </p>
                    <p className="text-[11px] text-[#666666]">
                      Supported: JPEG, PNG, WebP, AVIF up to 15MB
                    </p>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-1.5">
                  Photograph Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. 'Vogue Italia Editorial #04'"
                  className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-3.5 py-2.5 outline-none rounded-sm placeholder-[#444444]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-1.5">
                  Portfolio Category
                </label>
                <select
                  value={uploadCategoryId}
                  onChange={(e) => setUploadCategoryId(e.target.value)}
                  className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-3.5 py-2.5 outline-none rounded-sm font-mono"
                >
                  <option value="">-- No Category (Uncategorized) --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-1.5">
                  Artistic Description / Notes
                </label>
                <textarea
                  rows={3}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Editorial context, equipment, lighting or client details..."
                  className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm p-3.5 outline-none rounded-sm placeholder-[#444444] resize-y"
                />
              </div>

              {/* Featured Checkbox */}
              <label className="flex items-center gap-3 p-3 bg-[#161616] border border-[#252525] rounded-sm cursor-pointer hover:border-[#383838]">
                <input
                  type="checkbox"
                  checked={uploadFeatured}
                  onChange={(e) => setUploadFeatured(e.target.checked)}
                  className="accent-[#C9A86A] w-4 h-4 rounded"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-mono uppercase text-[#F7F5F0] flex items-center gap-1.5">
                    <Star className="w-3 h-3 text-[#C9A86A]" />
                    <span>Feature on Studio Showcase</span>
                  </span>
                  <span className="text-[11px] text-[#777777]">
                    Will be spotlighted on your public homepage hero carousel
                  </span>
                </div>
              </label>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E1E1E]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono uppercase text-[#888888] hover:text-[#F7F5F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C9A86A] hover:bg-[#B89758] text-[#0B0B0B] text-xs font-mono uppercase tracking-widest font-semibold rounded-sm transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Catalog</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Edit Metadata Modal */}
      {/* ========================================================================= */}
      {editingImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#2B2B2B] w-full max-w-lg rounded-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#1E1E1E] flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#F7F5F0] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#C9A86A]" />
                <span>Edit Photograph Details</span>
              </h3>
              <button
                onClick={() => setEditingImage(null)}
                className="text-[#777777] hover:text-[#F7F5F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
              <div className="flex items-center gap-4 p-3 bg-[#161616] border border-[#242424] rounded-sm">
                <div className="w-14 h-14 bg-black rounded-sm overflow-hidden shrink-0">
                  <img
                    src={editingImage.public_url}
                    alt="Current preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-mono text-[#888888] truncate">
                    Path: {editingImage.storage_path}
                  </p>
                  <p className="text-[11px] text-[#555555] font-mono mt-0.5">
                    Uploaded {new Date(editingImage.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-1.5">
                  Photograph Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-3.5 py-2.5 outline-none rounded-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-1.5">
                  Category
                </label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm px-3.5 py-2.5 outline-none rounded-sm font-mono"
                >
                  <option value="">-- No Category (Uncategorized) --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0] mb-1.5">
                  Description / Context
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-sm p-3.5 outline-none rounded-sm resize-y"
                />
              </div>

              <label className="flex items-center gap-3 p-3 bg-[#161616] border border-[#252525] rounded-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFeatured}
                  onChange={(e) => setEditFeatured(e.target.checked)}
                  className="accent-[#C9A86A] w-4 h-4 rounded"
                />
                <span className="text-xs font-mono uppercase text-[#F7F5F0] flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-[#C9A86A]" />
                  <span>Featured Hero Showcase</span>
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E1E1E]">
                <button
                  type="button"
                  onClick={() => setEditingImage(null)}
                  className="px-4 py-2 text-xs font-mono uppercase text-[#888888] hover:text-[#F7F5F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C9A86A] hover:bg-[#B89758] text-[#0B0B0B] text-xs font-mono uppercase tracking-widest font-semibold rounded-sm transition-colors disabled:opacity-50"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Category Management Modal */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#2B2B2B] w-full max-w-lg rounded-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#1E1E1E] flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#F7F5F0] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C9A86A]" />
                <span>Manage Portfolio Categories</span>
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-[#777777] hover:text-[#F7F5F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Create Category Form */}
              <form onSubmit={handleCreateCategory} className="space-y-3">
                <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0]">
                  Create New Category
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Editorial, Black & White, Runway..."
                    className="flex-1 bg-[#161616] border border-[#2B2B2B] focus:border-[#C9A86A] text-[#F7F5F0] text-xs px-3.5 py-2.5 outline-none rounded-sm placeholder-[#444444]"
                  />
                  <button
                    type="submit"
                    disabled={categorySubmitting || !newCategoryName.trim()}
                    className="px-4 py-2.5 bg-[#C9A86A] hover:bg-[#B89758] text-[#0B0B0B] text-xs font-mono uppercase tracking-wider font-semibold rounded-sm disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </form>

              {/* Category List */}
              <div className="space-y-2">
                <label className="block text-xs uppercase font-mono tracking-wider text-[#A0A0A0]">
                  Existing Categories ({categories.length})
                </label>

                {categories.length === 0 ? (
                  <p className="text-xs text-[#666666] italic py-3">
                    No custom categories created yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {categories.map((cat) => {
                      const count = images.filter((i) => i.category_id === cat.id).length;
                      return (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between p-3 bg-[#161616] border border-[#222222] rounded-sm"
                        >
                          {editingCatId === cat.id ? (
                            <div className="flex items-center gap-2 flex-1 mr-2">
                              <input
                                type="text"
                                value={editingCatName}
                                onChange={(e) => setEditingCatName(e.target.value)}
                                className="bg-[#202020] border border-[#C9A86A] text-[#F7F5F0] text-xs px-2.5 py-1.5 outline-none rounded-sm flex-1 font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateCategory(cat.id)}
                                className="p-1.5 text-[#C9A86A] hover:bg-[#2A2A2A] rounded-sm"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCatId(null)}
                                className="p-1.5 text-[#888888] hover:bg-[#2A2A2A] rounded-sm"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-[#F7F5F0] font-medium">{cat.name}</span>
                              <span className="text-xs font-mono text-[#666666]">
                                ({count} items)
                              </span>
                              {!cat.active && (
                                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-[#251515] text-[#FF8888] border border-[#442222] rounded-sm">
                                  Hidden
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleCategoryActive(cat)}
                              className={`p-1.5 text-xs rounded-sm ${
                                cat.active
                                  ? 'text-[#777777] hover:text-[#C9A86A]'
                                  : 'text-[#C9A86A] hover:text-[#E0E0E0]'
                              }`}
                              title={cat.active ? 'Hide category' : 'Show category'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditingCatName(cat.name);
                              }}
                              className="p-1.5 text-[#777777] hover:text-[#F7F5F0] rounded-sm"
                              title="Rename category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-1.5 text-[#777777] hover:text-[#FF6666] rounded-sm"
                              title="Delete category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-[#1E1E1E]">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#252525] text-[#F7F5F0] text-xs font-mono uppercase tracking-wider border border-[#333333] rounded-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Lightbox Fullscreen Preview Modal */}
      {/* ========================================================================= */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-full flex flex-col items-center"
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-[#AAAAAA] hover:text-[#F7F5F0] p-2"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={previewImage.public_url}
              alt={previewImage.title || 'Preview'}
              className="max-h-[75vh] w-auto object-contain rounded-sm shadow-2xl border border-[#2B2B2B]"
            />

            <div className="mt-4 text-center max-w-xl">
              <h3 className="font-serif text-xl text-[#F7F5F0]">
                {previewImage.title || 'Untitled Photograph'}
              </h3>
              {previewImage.description && (
                <p className="text-xs text-[#AAAAAA] mt-1">{previewImage.description}</p>
              )}
              <div className="flex items-center justify-center gap-4 mt-2 text-[11px] font-mono text-[#666666]">
                {previewImage.featured && (
                  <span className="text-[#C9A86A] flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> Featured Hero
                  </span>
                )}
                <span>Added {new Date(previewImage.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Delete Confirmation Modal */}
      {/* ========================================================================= */}
      {imageToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#331111] max-w-md w-full p-6 rounded-sm space-y-4">
            <h3 className="font-serif text-lg text-[#F7F5F0] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#E06A6A]" />
              <span>Confirm Deletion</span>
            </h3>
            <p className="text-xs text-[#A0A0A0] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[#F7F5F0]">{imageToDelete.title || 'this photograph'}</strong>?
              The high-resolution asset will be removed from your portfolio catalog.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setImageToDelete(null)}
                className="px-4 py-2 text-xs font-mono uppercase text-[#888888] hover:text-[#F7F5F0]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteImage}
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
