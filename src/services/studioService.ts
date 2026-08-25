import { api } from './api';
import { Category, PortfolioImage, Service, AvailabilityDay, DashboardStats } from '../types/phase2';
import { Profile } from '../types/auth';

export const studioService = {
  // ==========================================
  // Dashboard & Metrics
  // ==========================================
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await api.get('/photographers/dashboard-stats');
    return res.data.data;
  },

  // ==========================================
  // Profile Management
  // ==========================================
  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    const res = await api.put('/photographers/profile', updates);
    return res.data.data;
  },

  async uploadAvatar(file: File): Promise<{ profile_image_path: string; profile: Profile }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await api.post('/photographers/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  async removeAvatar(): Promise<Profile> {
    const res = await api.delete('/photographers/profile/avatar');
    return res.data.data;
  },

  // ==========================================
  // Categories
  // ==========================================
  async getCategories(): Promise<Category[]> {
    const res = await api.get('/photographers/categories');
    return res.data.data;
  },

  async createCategory(data: { name: string; slug?: string; active?: boolean }): Promise<Category> {
    const res = await api.post('/photographers/categories', data);
    return res.data.data;
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const res = await api.put(`/photographers/categories/${id}`, data);
    return res.data.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/photographers/categories/${id}`);
  },

  async reorderCategories(categoryIds: string[]): Promise<Category[]> {
    const res = await api.put('/photographers/categories/reorder', { categoryIds });
    return res.data.data;
  },

  // ==========================================
  // Portfolio Images
  // ==========================================
  async getPortfolioImages(categoryId?: string, featured?: boolean): Promise<PortfolioImage[]> {
    const params: Record<string, any> = {};
    if (categoryId) params.category_id = categoryId;
    if (featured !== undefined) params.featured = featured;

    const res = await api.get('/photographers/portfolio', { params });
    return res.data.data;
  },

  async uploadPortfolioImage(
    file: File,
    metadata?: {
      title?: string;
      description?: string;
      category_id?: string | null;
      featured?: boolean;
    }
  ): Promise<PortfolioImage> {
    const formData = new FormData();
    formData.append('image', file);
    if (metadata?.title) formData.append('title', metadata.title);
    if (metadata?.description) formData.append('description', metadata.description);
    if (metadata?.category_id) formData.append('category_id', metadata.category_id);
    if (metadata?.featured !== undefined) formData.append('featured', String(metadata.featured));

    const res = await api.post('/photographers/portfolio/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  async updatePortfolioImage(id: string, data: Partial<PortfolioImage>): Promise<PortfolioImage> {
    const res = await api.put(`/photographers/portfolio/${id}`, data);
    return res.data.data;
  },

  async deletePortfolioImage(id: string): Promise<void> {
    await api.delete(`/photographers/portfolio/${id}`);
  },

  async reorderPortfolioImages(imageIds: string[]): Promise<PortfolioImage[]> {
    const res = await api.put('/photographers/portfolio/reorder', { imageIds });
    return res.data.data;
  },

  // ==========================================
  // Services
  // ==========================================
  async getServices(): Promise<Service[]> {
    const res = await api.get('/photographers/services');
    return res.data.data;
  },

  async createService(data: {
    name: string;
    description?: string | null;
    price: number;
    currency?: string;
    duration_minutes: number;
    category?: string | null;
    featured?: boolean;
    active?: boolean;
    display_order?: number;
  }): Promise<Service> {
    const res = await api.post('/photographers/services', data);
    return res.data.data;
  },

  async updateService(id: string, data: Partial<Service>): Promise<Service> {
    const res = await api.put(`/photographers/services/${id}`, data);
    return res.data.data;
  },

  async deleteService(id: string): Promise<void> {
    await api.delete(`/photographers/services/${id}`);
  },

  // ==========================================
  // Availability & Working Days
  // ==========================================
  async getAvailability(): Promise<AvailabilityDay[]> {
    const res = await api.get('/photographers/availability');
    return res.data.data;
  },

  async saveAvailability(
    days: Array<{ day_of_week: number; start_time: string; end_time: string; enabled: boolean }>
  ): Promise<AvailabilityDay[]> {
    const res = await api.put('/photographers/availability', { days });
    return res.data.data;
  },

  // ==========================================
  // Public Studio Data (Phase 3)
  // ==========================================
  async getPublicStudio(slug: string): Promise<{
    profile: Profile;
    categories: Category[];
    portfolio: PortfolioImage[];
    services: Service[];
    availability: AvailabilityDay[];
  }> {
    try {
      const res = await api.get(`/photographers/${slug}/full`);
      return res.data.data;
    } catch {
      // Graceful fallback to individual endpoints
      const [profRes, catRes, portRes, servRes, availRes] = await Promise.all([
        api.get(`/photographers/${slug}`),
        api.get(`/photographers/${slug}/categories`).catch(() => ({ data: { data: [] } })),
        api.get(`/photographers/${slug}/portfolio`).catch(() => ({ data: { data: [] } })),
        api.get(`/photographers/${slug}/services`).catch(() => ({ data: { data: [] } })),
        api.get(`/photographers/${slug}/availability`).catch(() => ({ data: { data: [] } })),
      ]);

      return {
        profile: profRes.data.data,
        categories: catRes.data.data || [],
        portfolio: portRes.data.data || [],
        services: servRes.data.data || [],
        availability: availRes.data.data || [],
      };
    }
  },
};
