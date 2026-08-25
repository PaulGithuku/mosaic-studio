import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { env } from './env';

export interface ProfileRecord {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  bio?: string | null;
  profile_image_path?: string | null;
  location?: string | null;
  phone?: string | null;
  email: string;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  whatsapp?: string | null;
  specialties: string[];
  years_experience: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryRecord {
  id: string;
  photographer_id: string;
  name: string;
  slug: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioImageRecord {
  id: string;
  photographer_id: string;
  category_id?: string | null;
  category_name?: string | null;
  storage_path: string;
  public_url: string;
  title?: string | null;
  description?: string | null;
  featured: boolean;
  display_order: number;
  width?: number | null;
  height?: number | null;
  file_size?: number | null;
  mime_type?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceRecord {
  id: string;
  photographer_id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  duration_minutes: number;
  category?: string | null;
  featured: boolean;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityRecord {
  id: string;
  photographer_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'declined' | 'rescheduled' | 'completed';

export interface BookingRecord {
  id: string;
  photographer_id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  location?: string | null;
  message?: string | null;
  booking_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  price: number;
  status: BookingStatus;
  booking_reference: string;
  created_at: string;
  updated_at: string;
  service_name?: string;
  service_duration?: number;
  currency?: string;
  photographer_name?: string;
  photographer_slug?: string;
  photographer_email?: string;
}

// In-memory persistent fallback collections
const memoryProfiles = new Map<string, ProfileRecord>();
const memoryUsers = new Map<string, { id: string; email: string; name: string; created_at: string }>();
const memoryCategories = new Map<string, CategoryRecord>();
const memoryPortfolioImages = new Map<string, PortfolioImageRecord>();
const memoryServices = new Map<string, ServiceRecord>();
const memoryAvailability = new Map<string, AvailabilityRecord>();
const memoryBookings = new Map<string, BookingRecord>();

let supabaseAdminClient: SupabaseClient | null = null;
let supabaseDisabledFallback = false;

export const isSupabaseConfigured = (): boolean => {
  if (supabaseDisabledFallback) return false;
  return !!(env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY));
};

export const getSupabaseAdmin = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseAdminClient) {
    const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
    supabaseAdminClient = createClient(env.SUPABASE_URL, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdminClient;
};

/**
 * Verifies a Supabase Bearer token and returns the authenticated Supabase user
 */
export async function verifySupabaseToken(
  token: string
): Promise<{ user: SupabaseUser | { id: string; email: string; user_metadata?: Record<string, any> } | null; error: Error | null }> {
  if (!token) {
    return { user: null, error: new Error('No token provided') };
  }

  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client.auth.getUser(token);
      if (!error && data.user) {
        return { user: data.user, error: null };
      }
    } catch {
      // Fallback
    }
  }

  // Fallback JWT verification
  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, env.JWT_SECRET) as any;
    if (decoded && decoded.userId) {
      return {
        user: {
          id: decoded.userId,
          email: decoded.email,
          user_metadata: { name: decoded.name, role: decoded.role },
        },
        error: null,
      };
    }
  } catch (err: any) {
    return { user: null, error: err };
  }

  return { user: null, error: new Error('Invalid token') };
}

// =============================================================================
// REPOSITORIES
// =============================================================================

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'photographer';
}

export const profileRepository = {
  async findById(id: string): Promise<ProfileRecord | null> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        const { data, error } = await client.from('profiles').select('*').eq('id', id).maybeSingle();
        if (!error && data) return data;
      } catch {}
    }

    for (const p of memoryProfiles.values()) {
      if (p.id === id) return p;
    }
    return null;
  },

  async findByUserId(userId: string): Promise<ProfileRecord | null> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        const { data, error } = await client.from('profiles').select('*').eq('user_id', userId).maybeSingle();
        if (!error && data) return data;
      } catch {}
    }

    return memoryProfiles.get(userId) || null;
  },

  async findByEmail(email: string): Promise<ProfileRecord | null> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        const { data, error } = await client.from('profiles').select('*').eq('email', email.toLowerCase()).maybeSingle();
        if (!error && data) return data;
      } catch {}
    }

    for (const profile of memoryProfiles.values()) {
      if (profile.email.toLowerCase() === email.toLowerCase()) {
        return profile;
      }
    }
    return null;
  },

  async findBySlug(slug: string): Promise<ProfileRecord | null> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        const { data, error } = await client.from('profiles').select('*').eq('slug', slug.toLowerCase()).maybeSingle();
        if (!error && data) return data;
      } catch {}
    }

    for (const profile of memoryProfiles.values()) {
      if (profile.slug.toLowerCase() === slug.toLowerCase()) {
        return profile;
      }
    }
    return null;
  },

  async existsBySlug(slug: string, excludeUserId?: string): Promise<boolean> {
    const p = await this.findBySlug(slug);
    if (!p) return false;
    if (excludeUserId && p.user_id === excludeUserId) return false;
    return true;
  },

  registerDevUser(user: { id: string; email: string; name: string }): void {
    memoryUsers.set(user.id, { ...user, created_at: new Date().toISOString() });
  },

  findDevUser(id: string): { id: string; email: string; name: string; created_at: string } | null {
    return memoryUsers.get(id) || null;
  },

  /**
   * Idempotently ensures a profile row exists for the given authenticated user ID.
   * If already existing, returns the existing record.
   * If missing, initializes a new profile with unique slug.
   */
  async ensureProfile(params: {
    user_id: string;
    email: string;
    name?: string;
    slug?: string;
  }): Promise<ProfileRecord> {
    const { user_id, email } = params;
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = (params.name || cleanEmail.split('@')[0] || 'Photographer').trim();

    // 1. Check if profile already exists by user_id
    const existing = await this.findByUserId(user_id);
    if (existing) {
      return existing;
    }

    // 2. Derive unique slug
    let baseSlug = generateSlug(params.slug || cleanName);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await this.existsBySlug(uniqueSlug, user_id)) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const client = getSupabaseAdmin();
    if (client) {
      try {
        // Attempt upsert on user_id conflict
        const { data, error } = await client
          .from('profiles')
          .upsert(
            {
              user_id,
              name: cleanName,
              slug: uniqueSlug,
              email: cleanEmail,
              specialties: ['Portrait', 'Editorial'],
              years_experience: 1,
              bio: '',
              location: '',
              phone: '',
            },
            { onConflict: 'user_id' }
          )
          .select()
          .single();

        if (!error && data) {
          memoryProfiles.set(user_id, data);
          return data;
        }
      } catch (err: any) {
        console.warn('[Supabase] Profile ensure error, falling back to local store:', err?.message);
      }
    }

    // Fallback store
    const newRecord: ProfileRecord = {
      id: crypto.randomUUID(),
      user_id,
      name: cleanName,
      slug: uniqueSlug,
      email: cleanEmail,
      bio: '',
      location: '',
      phone: '',
      website: '',
      instagram: '',
      facebook: '',
      tiktok: '',
      whatsapp: '',
      specialties: ['Portrait', 'Editorial'],
      years_experience: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryProfiles.set(user_id, newRecord);
    return newRecord;
  },

  async create(record: Omit<ProfileRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ProfileRecord> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        const { data, error } = await client.from('profiles').insert(record).select().single();
        if (!error && data) {
          memoryProfiles.set(record.user_id, data);
          return data;
        }
      } catch {}
    }

    const newRecord: ProfileRecord = {
      ...record,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryProfiles.set(record.user_id, newRecord);
    return newRecord;
  },

  async update(userId: string, updates: Partial<ProfileRecord>): Promise<ProfileRecord> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        const { data, error } = await client
          .from('profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .select()
          .single();
        if (!error && data) {
          memoryProfiles.set(userId, data);
          return data;
        }
      } catch {}
    }

    let existing = memoryProfiles.get(userId);
    if (!existing) {
      // Auto-initialize if updating for the first time
      existing = await this.ensureProfile({
        user_id: userId,
        email: updates.email || 'photographer@mosaic.studio',
        name: updates.name || 'Photographer',
      });
    }

    const updated: ProfileRecord = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    memoryProfiles.set(userId, updated);
    return updated;
  },
};

export const userRepository = {
  async findById(id: string): Promise<{ id: string; email: string; name: string; created_at: string } | null> {
    return memoryUsers.get(id) || null;
  },

  async save(user: { id: string; email: string; name: string; created_at: string }): Promise<void> {
    memoryUsers.set(user.id, user);
  },
};

export const categoryRepository = {
  async findByPhotographer(photographerId: string, activeOnly: boolean = false): Promise<CategoryRecord[]> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        let query = client
          .from('portfolio_categories')
          .select('*')
          .eq('photographer_id', photographerId)
          .order('display_order', { ascending: true });

        if (activeOnly) {
          query = query.eq('active', true);
        }

        const { data, error } = await query;
        if (!error && data) return data;
      } catch {}
    }

    const list: CategoryRecord[] = [];
    for (const cat of memoryCategories.values()) {
      if (cat.photographer_id === photographerId) {
        if (!activeOnly || cat.active) {
          list.push(cat);
        }
      }
    }
    return list.sort((a, b) => a.display_order - b.display_order);
  },

  async listByPhotographer(photographerId: string, activeOnly: boolean = false): Promise<CategoryRecord[]> {
    return this.findByPhotographer(photographerId, activeOnly);
  },

  async countByPhotographer(photographerId: string): Promise<number> {
    const list = await this.findByPhotographer(photographerId);
    return list.length;
  },

  async findBySlug(photographerId: string, slug: string): Promise<CategoryRecord | null> {
    const list = await this.findByPhotographer(photographerId);
    return list.find((c) => c.slug.toLowerCase() === slug.toLowerCase()) || null;
  },

  async findById(id: string, photographerId?: string): Promise<CategoryRecord | null> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        let query = client.from('portfolio_categories').select('*').eq('id', id);
        if (photographerId) {
          query = query.eq('photographer_id', photographerId);
        }
        const { data, error } = await query.maybeSingle();
        if (!error && data) return data;
      } catch {}
    }

    const cat = memoryCategories.get(id);
    if (!cat) return null;
    if (photographerId && cat.photographer_id !== photographerId) return null;
    return cat;
  },

  async create(record: Omit<CategoryRecord, 'id' | 'created_at' | 'updated_at'>): Promise<CategoryRecord> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        const { data, error } = await client.from('portfolio_categories').insert(record).select().single();
        if (!error && data) return data;
      } catch {}
    }

    const id = crypto.randomUUID();
    const newCat: CategoryRecord = {
      ...record,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryCategories.set(id, newCat);
    return newCat;
  },

  async update(id: string, arg2: string | Partial<CategoryRecord>, arg3?: Partial<CategoryRecord>): Promise<CategoryRecord | null> {
    const photographerId = typeof arg2 === 'string' ? arg2 : undefined;
    const updates = (typeof arg2 === 'object' ? arg2 : arg3) || {};

    const client = getSupabaseAdmin();
    if (client) {
      try {
        let query = client
          .from('portfolio_categories')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (photographerId) {
          query = query.eq('photographer_id', photographerId);
        }
        const { data, error } = await query.select().single();
        if (!error && data) return data;
      } catch {}
    }

    const cat = memoryCategories.get(id);
    if (!cat) return null;
    if (photographerId && cat.photographer_id !== photographerId) return null;

    const updated: CategoryRecord = {
      ...cat,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    memoryCategories.set(id, updated);
    return updated;
  },

  async delete(id: string, photographerId?: string): Promise<boolean> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        let query = client.from('portfolio_categories').delete().eq('id', id);
        if (photographerId) {
          query = query.eq('photographer_id', photographerId);
        }
        const { error } = await query;
        if (!error) return true;
      } catch {}
    }

    const cat = memoryCategories.get(id);
    if (!cat) return false;
    if (photographerId && cat.photographer_id !== photographerId) return false;
    memoryCategories.delete(id);
    return true;
  },

  async reorder(photographerId: string, categoryIds: string[]): Promise<CategoryRecord[]> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        for (let i = 0; i < categoryIds.length; i++) {
          await client
            .from('portfolio_categories')
            .update({ display_order: i, updated_at: new Date().toISOString() })
            .eq('id', categoryIds[i])
            .eq('photographer_id', photographerId);
        }
      } catch {}
    }

    categoryIds.forEach((catId, index) => {
      const cat = memoryCategories.get(catId);
      if (cat && cat.photographer_id === photographerId) {
        memoryCategories.set(catId, { ...cat, display_order: index, updated_at: new Date().toISOString() });
      }
    });

    return this.findByPhotographer(photographerId);
  },
};

export const portfolioRepository = {
  async findByPhotographer(
    photographerId: string,
    arg2?: string | { categoryId?: string; featured?: boolean },
    arg3?: boolean
  ): Promise<PortfolioImageRecord[]> {
    let categoryId: string | undefined;
    let featured: boolean | undefined;

    if (typeof arg2 === 'object' && arg2 !== null) {
      categoryId = arg2.categoryId;
      featured = arg2.featured;
    } else if (typeof arg2 === 'string') {
      categoryId = arg2;
      featured = arg3;
    } else {
      featured = arg3;
    }

    const client = getSupabaseAdmin();
    if (client) {
      try {
        let query = client
          .from('portfolio_images')
          .select('*, portfolio_categories(name)')
          .eq('photographer_id', photographerId)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }
        if (featured !== undefined) {
          query = query.eq('featured', featured);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.map((item: any) => ({
            ...item,
            category_name: item.category_name || item.portfolio_categories?.name || null,
          }));
        }
      } catch {}
    }

    const list: PortfolioImageRecord[] = [];
    for (const img of memoryPortfolioImages.values()) {
      if (img.photographer_id === photographerId) {
        if (categoryId && img.category_id !== categoryId) continue;
        if (featured !== undefined && img.featured !== featured) continue;
        const cat = img.category_id ? memoryCategories.get(img.category_id) : null;
        list.push({
          ...img,
          category_name: img.category_name || cat?.name || null,
        });
      }
    }
    return list.sort((a, b) => a.display_order - b.display_order);
  },

  async listByPhotographer(
    photographerId: string,
    arg2?: string | { categoryId?: string; featured?: boolean },
    arg3?: boolean
  ): Promise<PortfolioImageRecord[]> {
    return this.findByPhotographer(photographerId, arg2 as any, arg3);
  },

  async countByPhotographer(photographerId: string): Promise<number> {
    const list = await this.findByPhotographer(photographerId);
    return list.length;
  },

  async findById(id: string, photographerId?: string): Promise<PortfolioImageRecord | null> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        let query = client.from('portfolio_images').select('*, portfolio_categories(name)').eq('id', id);
        if (photographerId) {
          query = query.eq('photographer_id', photographerId);
        }
        const { data, error } = await query.maybeSingle();
        if (!error && data) {
          return {
            ...data,
            category_name: data.category_name || data.portfolio_categories?.name || null,
          };
        }
      } catch {}
    }

    const img = memoryPortfolioImages.get(id);
    if (!img) return null;
    if (photographerId && img.photographer_id !== photographerId) return null;
    const cat = img.category_id ? memoryCategories.get(img.category_id) : null;
    return {
      ...img,
      category_name: img.category_name || cat?.name || null,
    };
  },

  async create(record: Omit<PortfolioImageRecord, 'id' | 'created_at' | 'updated_at'>): Promise<PortfolioImageRecord> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        const { data, error } = await client.from('portfolio_images').insert(record).select('*, portfolio_categories(name)').single();
        if (!error && data) {
          return {
            ...data,
            category_name: data.category_name || data.portfolio_categories?.name || null,
          };
        }
      } catch {}
    }

    const id = crypto.randomUUID();
    const cat = record.category_id ? memoryCategories.get(record.category_id) : null;
    const newImg: PortfolioImageRecord = {
      ...record,
      category_name: record.category_name || cat?.name || null,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryPortfolioImages.set(id, newImg);
    return newImg;
  },

  async update(id: string, arg2: string | Partial<PortfolioImageRecord>, arg3?: Partial<PortfolioImageRecord>): Promise<PortfolioImageRecord | null> {
    const photographerId = typeof arg2 === 'string' ? arg2 : undefined;
    const updates = (typeof arg2 === 'object' ? arg2 : arg3) || {};

    const client = getSupabaseAdmin();
    if (client) {
      try {
        let query = client
          .from('portfolio_images')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (photographerId) {
          query = query.eq('photographer_id', photographerId);
        }
        const { data, error } = await query.select().single();
        if (!error && data) return data;
      } catch {}
    }

    const img = memoryPortfolioImages.get(id);
    if (!img) return null;
    if (photographerId && img.photographer_id !== photographerId) return null;

    const updated: PortfolioImageRecord = {
      ...img,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    memoryPortfolioImages.set(id, updated);
    return updated;
  },

  async delete(id: string, photographerId?: string): Promise<boolean> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        let query = client.from('portfolio_images').delete().eq('id', id);
        if (photographerId) {
          query = query.eq('photographer_id', photographerId);
        }
        const { error } = await query;
        if (!error) return true;
      } catch {}
    }

    const img = memoryPortfolioImages.get(id);
    if (!img) return false;
    if (photographerId && img.photographer_id !== photographerId) return false;
    memoryPortfolioImages.delete(id);
    return true;
  },

  async reorder(photographerId: string, imageIds: string[]): Promise<PortfolioImageRecord[]> {
    imageIds.forEach((imgId, index) => {
      const img = memoryPortfolioImages.get(imgId);
      if (img && img.photographer_id === photographerId) {
        memoryPortfolioImages.set(imgId, { ...img, display_order: index, updated_at: new Date().toISOString() });
      }
    });
    return this.findByPhotographer(photographerId);
  },
};

export const serviceRepository = {
  async findByPhotographer(photographerId: string, activeOnly: boolean = false): Promise<ServiceRecord[]> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        let query = client
          .from('services')
          .select('*')
          .eq('photographer_id', photographerId)
          .order('display_order', { ascending: true });

        if (activeOnly) {
          query = query.eq('active', true);
        }

        const { data, error } = await query;
        if (!error && data) return data;
      } catch {}
    }

    const list: ServiceRecord[] = [];
    for (const serv of memoryServices.values()) {
      if (serv.photographer_id === photographerId) {
        if (!activeOnly || serv.active) {
          list.push(serv);
        }
      }
    }
    return list.sort((a, b) => a.display_order - b.display_order);
  },

  async listByPhotographer(photographerId: string, activeOnly: boolean = false): Promise<ServiceRecord[]> {
    return this.findByPhotographer(photographerId, activeOnly);
  },

  async countByPhotographer(photographerId: string): Promise<number> {
    const list = await this.findByPhotographer(photographerId);
    return list.length;
  },

  async findById(id: string, photographerId?: string): Promise<ServiceRecord | null> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        let query = client.from('services').select('*').eq('id', id);
        if (photographerId) {
          query = query.eq('photographer_id', photographerId);
        }
        const { data, error } = await query.maybeSingle();
        if (!error && data) return data;
      } catch {}
    }

    const serv = memoryServices.get(id);
    if (!serv) return null;
    if (photographerId && serv.photographer_id !== photographerId) return null;
    return serv;
  },

  async create(record: Omit<ServiceRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceRecord> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        const { data, error } = await client.from('services').insert(record).select().single();
        if (!error && data) return data;
      } catch {}
    }

    const id = crypto.randomUUID();
    const newServ: ServiceRecord = {
      ...record,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryServices.set(id, newServ);
    return newServ;
  },

  async update(id: string, arg2: string | Partial<ServiceRecord>, arg3?: Partial<ServiceRecord>): Promise<ServiceRecord | null> {
    const photographerId = typeof arg2 === 'string' ? arg2 : undefined;
    const updates = (typeof arg2 === 'object' ? arg2 : arg3) || {};

    const client = getSupabaseAdmin();
    if (client) {
      try {
        let query = client
          .from('services')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (photographerId) {
          query = query.eq('photographer_id', photographerId);
        }
        const { data, error } = await query.select().single();
        if (!error && data) return data;
      } catch {}
    }

    const serv = memoryServices.get(id);
    if (!serv) return null;
    if (photographerId && serv.photographer_id !== photographerId) return null;

    const updated: ServiceRecord = {
      ...serv,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    memoryServices.set(id, updated);
    return updated;
  },

  async delete(id: string, photographerId?: string): Promise<boolean> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        let query = client.from('services').delete().eq('id', id);
        if (photographerId) {
          query = query.eq('photographer_id', photographerId);
        }
        const { error } = await query;
        if (!error) return true;
      } catch {}
    }

    const serv = memoryServices.get(id);
    if (!serv) return false;
    if (photographerId && serv.photographer_id !== photographerId) return false;
    memoryServices.delete(id);
    return true;
  },
};

export const availabilityRepository = {
  async findByPhotographer(photographerId: string): Promise<AvailabilityRecord[]> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        const { data, error } = await client
          .from('availability')
          .select('*')
          .eq('photographer_id', photographerId)
          .order('day_of_week', { ascending: true });

        if (!error && data) return data;
      } catch {}
    }

    const list: AvailabilityRecord[] = [];
    for (const avail of memoryAvailability.values()) {
      if (avail.photographer_id === photographerId) {
        list.push(avail);
      }
    }
    return list.sort((a, b) => a.day_of_week - b.day_of_week);
  },

  async getSchedule(photographerId: string): Promise<AvailabilityRecord[]> {
    return this.findByPhotographer(photographerId);
  },

  async saveSchedule(
    photographerId: string,
    days: Array<{ day_of_week: number; start_time: string; end_time: string; enabled: boolean }>
  ): Promise<AvailabilityRecord[]> {
    return this.upsertMany(photographerId, days);
  },

  async upsertMany(
    photographerId: string,
    days: Array<{ day_of_week: number; start_time: string; end_time: string; enabled: boolean }>
  ): Promise<AvailabilityRecord[]> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        const records = days.map((d) => ({
          photographer_id: photographerId,
          day_of_week: d.day_of_week,
          start_time: d.start_time,
          end_time: d.end_time,
          enabled: d.enabled,
          updated_at: new Date().toISOString(),
        }));

        const { data, error } = await client
          .from('availability')
          .upsert(records, { onConflict: 'photographer_id,day_of_week' })
          .select();

        if (!error && data) return data;
      } catch {}
    }

    const results: AvailabilityRecord[] = [];
    for (const d of days) {
      const key = `${photographerId}_${d.day_of_week}`;
      const existing = memoryAvailability.get(key);
      const rec: AvailabilityRecord = {
        id: existing?.id || crypto.randomUUID(),
        photographer_id: photographerId,
        day_of_week: d.day_of_week,
        start_time: d.start_time,
        end_time: d.end_time,
        enabled: d.enabled,
        created_at: existing?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryAvailability.set(key, rec);
      results.push(rec);
    }
    return results;
  },
};

/**
 * Helper to enrich a raw DB booking record with service and profile details
 */
async function enrichBookingRecord(b: any): Promise<BookingRecord> {
  let serviceName = b.service_name || b.services?.name;
  let serviceDuration = b.service_duration || b.services?.duration_minutes;
  let currency = b.currency || b.services?.currency || 'EUR';

  if (!serviceName && b.service_id) {
    const s = memoryServices.get(b.service_id) || (await serviceRepository.findById(b.service_id, b.photographer_id));
    if (s) {
      serviceName = s.name;
      serviceDuration = s.duration_minutes;
      currency = s.currency || currency;
    }
  }

  let photographerName = b.photographer_name || b.profiles?.name;
  let photographerSlug = b.photographer_slug || b.profiles?.slug;
  let photographerEmail = b.photographer_email || b.profiles?.email;

  if (!photographerName && b.photographer_id) {
    const p = memoryProfiles.get(b.photographer_id) || (await profileRepository.findById(b.photographer_id));
    if (p) {
      photographerName = p.name;
      photographerSlug = p.slug;
      photographerEmail = p.email;
    }
  }

  const startTimeStr = typeof b.start_time === 'string' ? b.start_time.substring(0, 5) : b.start_time;
  const endTimeStr = typeof b.end_time === 'string' ? b.end_time.substring(0, 5) : b.end_time;

  return {
    id: b.id,
    photographer_id: b.photographer_id,
    service_id: b.service_id,
    customer_name: b.customer_name,
    customer_email: b.customer_email,
    customer_phone: b.customer_phone || null,
    location: b.location || null,
    message: b.message || null,
    booking_date: b.booking_date,
    start_time: startTimeStr,
    end_time: endTimeStr,
    price: Number(b.price || 0),
    status: b.status,
    booking_reference: b.booking_reference,
    created_at: b.created_at || new Date().toISOString(),
    updated_at: b.updated_at || new Date().toISOString(),
    service_name: serviceName || 'Commission Package',
    service_duration: serviceDuration || 60,
    currency: currency || 'EUR',
    photographer_name: photographerName || 'Studio Photographer',
    photographer_slug: photographerSlug || '',
    photographer_email: photographerEmail || '',
  };
}

export const bookingRepository = {
  /**
   * Checks if an active booking overlaps with the requested interval
   */
  async checkConflict(
    photographerId: string,
    bookingDate: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    const activeStatuses: BookingStatus[] = ['pending', 'confirmed', 'rescheduled'];

    const client = getSupabaseAdmin();
    if (client) {
      try {
        let query = client
          .from('bookings')
          .select('id, start_time, end_time, status')
          .eq('photographer_id', photographerId)
          .eq('booking_date', bookingDate)
          .in('status', activeStatuses);

        if (excludeBookingId) {
          query = query.neq('id', excludeBookingId);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.some((b: any) => {
            const bStart = typeof b.start_time === 'string' ? b.start_time.substring(0, 5) : b.start_time;
            const bEnd = typeof b.end_time === 'string' ? b.end_time.substring(0, 5) : b.end_time;
            return bStart < endTime && bEnd > startTime;
          });
        }
      } catch {}
    }

    // In-memory fallback
    for (const b of memoryBookings.values()) {
      if (
        b.photographer_id === photographerId &&
        b.booking_date === bookingDate &&
        activeStatuses.includes(b.status) &&
        b.id !== excludeBookingId
      ) {
        if (b.start_time < endTime && b.end_time > startTime) {
          return true;
        }
      }
    }
    return false;
  },

  /**
   * Lists all bookings for a photographer with optional filters
   */
  async listByPhotographer(
    photographerId: string,
    filters?: {
      status?: BookingStatus | 'upcoming';
      startDate?: string;
      endDate?: string;
      search?: string;
    }
  ): Promise<BookingRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    const client = getSupabaseAdmin();
    let supabaseList: BookingRecord[] | null = null;

    if (client) {
      try {
        let query = client
          .from('bookings')
          .select('*')
          .eq('photographer_id', photographerId)
          .order('booking_date', { ascending: false })
          .order('start_time', { ascending: true });

        if (filters?.status) {
          if (filters.status === 'upcoming') {
            query = query
              .gte('booking_date', today)
              .in('status', ['pending', 'confirmed', 'rescheduled']);
          } else {
            query = query.eq('status', filters.status);
          }
        }

        if (filters?.startDate) {
          query = query.gte('booking_date', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('booking_date', filters.endDate);
        }

        const { data, error } = await query;
        if (!error && data) {
          supabaseList = await Promise.all(data.map((b) => enrichBookingRecord(b)));
        }
      } catch (err: any) {
        console.warn('[Supabase] listByPhotographer error:', err?.message);
      }
    }

    // Merge or fallback to memory bookings
    const map = new Map<string, BookingRecord>();
    if (supabaseList) {
      for (const b of supabaseList) {
        map.set(b.id, b);
        memoryBookings.set(b.id, b);
      }
    }

    for (const b of memoryBookings.values()) {
      if (b.photographer_id === photographerId && !map.has(b.id)) {
        if (filters?.status) {
          if (filters.status === 'upcoming') {
            if (b.booking_date < today || !['pending', 'confirmed', 'rescheduled'].includes(b.status)) {
              continue;
            }
          } else if (b.status !== filters.status) {
            continue;
          }
        }
        if (filters?.startDate && b.booking_date < filters.startDate) continue;
        if (filters?.endDate && b.booking_date > filters.endDate) continue;

        const enriched = await enrichBookingRecord(b);
        map.set(b.id, enriched);
      }
    }

    let result = Array.from(map.values());

    if (filters?.search) {
      const s = filters.search.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.customer_name?.toLowerCase().includes(s) ||
          b.customer_email?.toLowerCase().includes(s) ||
          b.booking_reference?.toLowerCase().includes(s) ||
          b.service_name?.toLowerCase().includes(s)
      );
    }

    return result.sort((a, b) => {
      if (a.booking_date !== b.booking_date) {
        return b.booking_date.localeCompare(a.booking_date);
      }
      return a.start_time.localeCompare(b.start_time);
    });
  },

  /**
   * Retrieves a single booking by ID with ownership verification
   */
  async findById(id: string, photographerId?: string): Promise<BookingRecord | null> {
    const client = getSupabaseAdmin();
    if (client) {
      try {
        let query = client
          .from('bookings')
          .select('*')
          .eq('id', id);

        if (photographerId) {
          query = query.eq('photographer_id', photographerId);
        }

        const { data, error } = await query.maybeSingle();
        if (!error && data) {
          const enriched = await enrichBookingRecord(data);
          memoryBookings.set(enriched.id, enriched);
          return enriched;
        }
      } catch {}
    }

    const b = memoryBookings.get(id);
    if (!b) return null;
    if (photographerId && b.photographer_id !== photographerId) return null;

    return await enrichBookingRecord(b);
  },

  /**
   * Public lookup by booking reference
   */
  async findByReference(reference: string): Promise<BookingRecord | null> {
    const refUpper = reference.toUpperCase().trim();
    const client = getSupabaseAdmin();
    if (client) {
      try {
        const { data, error } = await client
          .from('bookings')
          .select('*')
          .eq('booking_reference', refUpper)
          .maybeSingle();

        if (!error && data) {
          const enriched = await enrichBookingRecord(data);
          memoryBookings.set(enriched.id, enriched);
          return enriched;
        }
      } catch {}
    }

    for (const b of memoryBookings.values()) {
      if (b.booking_reference.toUpperCase() === refUpper) {
        return await enrichBookingRecord(b);
      }
    }
    return null;
  },

  /**
   * Creates a booking with atomic double-booking conflict validation
   */
  async create(record: Omit<BookingRecord, 'id' | 'created_at' | 'updated_at'>): Promise<BookingRecord> {
    // 1. Conflict check
    const hasConflict = await this.checkConflict(
      record.photographer_id,
      record.booking_date,
      record.start_time,
      record.end_time
    );

    if (hasConflict) {
      const err = new Error('DOUBLE_BOOKING_CONFLICT: The selected time slot is already reserved.');
      (err as any).code = 'OVERLAPPING_BOOKING_CONFLICT';
      throw err;
    }

    const id = crypto.randomUUID();
    const cleanDbPayload = {
      id,
      photographer_id: record.photographer_id,
      service_id: record.service_id,
      customer_name: record.customer_name,
      customer_email: record.customer_email,
      customer_phone: record.customer_phone || null,
      location: record.location || null,
      message: record.message || null,
      booking_date: record.booking_date,
      start_time: record.start_time,
      end_time: record.end_time,
      price: record.price,
      status: record.status || 'pending',
      booking_reference: record.booking_reference,
    };

    const client = getSupabaseAdmin();
    if (client) {
      try {
        const { data, error } = await client
          .from('bookings')
          .insert(cleanDbPayload)
          .select('*')
          .single();

        if (!error && data) {
          const enriched = await enrichBookingRecord({ ...data, ...record });
          memoryBookings.set(enriched.id, enriched);
          return enriched;
        }
      } catch (err: any) {
        if (err.code === '23505' || err.message?.includes('conflict') || err.message?.includes('OVERLAPPING')) {
          const conflictErr = new Error('DOUBLE_BOOKING_CONFLICT: Slot already reserved.');
          (conflictErr as any).code = 'OVERLAPPING_BOOKING_CONFLICT';
          throw conflictErr;
        }
      }
    }

    const serv = memoryServices.get(record.service_id);
    const prof = memoryProfiles.get(record.photographer_id);

    const newBooking: BookingRecord = {
      ...record,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      service_name: record.service_name || serv?.name || 'Commission Package',
      service_duration: record.service_duration || serv?.duration_minutes || 60,
      currency: record.currency || serv?.currency || 'EUR',
      photographer_name: record.photographer_name || prof?.name || 'Studio Photographer',
      photographer_slug: record.photographer_slug || prof?.slug || '',
      photographer_email: record.photographer_email || prof?.email || '',
    };

    memoryBookings.set(id, newBooking);
    return newBooking;
  },

  /**
   * Updates booking status (confirm, decline, cancel, complete)
   */
  async updateStatus(
    id: string,
    photographerId: string,
    status: BookingStatus,
    updates?: Partial<BookingRecord>
  ): Promise<BookingRecord | null> {
    const booking = await this.findById(id, photographerId);
    if (!booking) return null;

    const client = getSupabaseAdmin();
    if (client) {
      try {
        const updatePayload: Record<string, any> = {
          status,
          updated_at: new Date().toISOString(),
        };

        if (updates?.booking_date) updatePayload.booking_date = updates.booking_date;
        if (updates?.start_time) updatePayload.start_time = updates.start_time;
        if (updates?.end_time) updatePayload.end_time = updates.end_time;
        if (updates?.price !== undefined) updatePayload.price = updates.price;

        const { data, error } = await client
          .from('bookings')
          .update(updatePayload)
          .eq('id', id)
          .eq('photographer_id', photographerId)
          .select('*')
          .single();

        if (!error && data) {
          const enriched = await enrichBookingRecord({ ...booking, ...data, ...updates });
          memoryBookings.set(id, enriched);
          return enriched;
        }
      } catch {}
    }

    const updated: BookingRecord = {
      ...booking,
      ...updates,
      status,
      updated_at: new Date().toISOString(),
    };
    memoryBookings.set(id, updated);
    return updated;
  },

  /**
   * Reschedules a booking with conflict checking for the new interval
   */
  async reschedule(
    id: string,
    photographerId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ): Promise<BookingRecord> {
    const booking = await this.findById(id, photographerId);
    if (!booking) {
      throw new Error('Booking not found or unauthorized');
    }

    // Check conflict excluding current booking
    const hasConflict = await this.checkConflict(
      photographerId,
      newDate,
      newStartTime,
      newEndTime,
      id
    );

    if (hasConflict) {
      const err = new Error('RESCHEDULE_CONFLICT: The selected reschedule slot is already occupied.');
      (err as any).code = 'OVERLAPPING_BOOKING_CONFLICT';
      throw err;
    }

    return (await this.updateStatus(id, photographerId, 'rescheduled', {
      booking_date: newDate,
      start_time: newStartTime,
      end_time: newEndTime,
    }))!;
  },

  /**
   * Gets occupied intervals on a specific date for availability calculation
   */
  async getOccupiedSlots(
    photographerId: string,
    date: string
  ): Promise<Array<{ start_time: string; end_time: string; status: BookingStatus }>> {
    const activeStatuses: BookingStatus[] = ['pending', 'confirmed', 'rescheduled'];

    const client = getSupabaseAdmin();
    if (client) {
      try {
        const { data, error } = await client
          .from('bookings')
          .select('start_time, end_time, status')
          .eq('photographer_id', photographerId)
          .eq('booking_date', date)
          .in('status', activeStatuses);

        if (!error && data) return data;
      } catch {}
    }

    const occupied: Array<{ start_time: string; end_time: string; status: BookingStatus }> = [];
    for (const b of memoryBookings.values()) {
      if (
        b.photographer_id === photographerId &&
        b.booking_date === date &&
        activeStatuses.includes(b.status)
      ) {
        occupied.push({
          start_time: b.start_time,
          end_time: b.end_time,
          status: b.status,
        });
      }
    }
    return occupied;
  },

  /**
   * Computes aggregated metrics for the photographer dashboard
   */
  async getDashboardBookingStats(photographerId: string) {
    const today = new Date().toISOString().split('T')[0];
    let allBookings: Array<{
      id: string;
      price: number;
      status: BookingStatus;
      booking_date: string;
      service_id?: string | null;
      service_name?: string;
    }> = [];

    const client = getSupabaseAdmin();
    if (client) {
      try {
        const { data, error } = await client
          .from('bookings')
          .select('id, price, status, booking_date, service_id, service_name')
          .eq('photographer_id', photographerId);

        if (!error && data) {
          allBookings = data as any;
        }
      } catch {}
    }

    if (allBookings.length === 0) {
      for (const b of memoryBookings.values()) {
        if (b.photographer_id === photographerId) {
          allBookings.push(b);
        }
      }
    }

    const pending = allBookings.filter((b) => b.status === 'pending').length;
    const confirmedCount = allBookings.filter((b) => b.status === 'confirmed' || b.status === 'rescheduled').length;
    const confirmedUpcoming = allBookings.filter(
      (b) => (b.status === 'confirmed' || b.status === 'rescheduled') && b.booking_date >= today
    ).length;
    const completed = allBookings.filter((b) => b.status === 'completed').length;
    const cancelled = allBookings.filter((b) => b.status === 'cancelled' || b.status === 'declined').length;
    
    const paidBookings = allBookings.filter(
      (b) => b.status === 'confirmed' || b.status === 'completed' || b.status === 'rescheduled'
    );
    const totalEarnings = paidBookings.reduce((sum, b) => sum + Number(b.price || 0), 0);
    const averageBookingValue = paidBookings.length > 0 ? Math.round(totalEarnings / paidBookings.length) : 0;

    // Calculate Most Booked Service
    const serviceCounts: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const b of allBookings) {
      const sName = b.service_name || 'Commission Package';
      if (!serviceCounts[sName]) {
        serviceCounts[sName] = { name: sName, count: 0, revenue: 0 };
      }
      serviceCounts[sName].count += 1;
      if (b.status === 'confirmed' || b.status === 'completed' || b.status === 'rescheduled') {
        serviceCounts[sName].revenue += Number(b.price || 0);
      }
    }

    let mostBookedService: { name: string; count: number; revenue: number } | null = null;
    let highestCount = 0;
    for (const item of Object.values(serviceCounts)) {
      if (item.count > highestCount) {
        highestCount = item.count;
        mostBookedService = item;
      }
    }

    // Monthly Trends for past 6 months
    const monthlyTrends: Array<{ month: string; bookings: number; revenue: number }> = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });

      const monthBookings = allBookings.filter((b) => b.booking_date && b.booking_date.startsWith(monthKey));
      const monthRevenue = monthBookings
        .filter((b) => b.status === 'confirmed' || b.status === 'completed' || b.status === 'rescheduled')
        .reduce((sum, b) => sum + Number(b.price || 0), 0);

      monthlyTrends.push({
        month: monthLabel,
        bookings: monthBookings.length,
        revenue: monthRevenue,
      });
    }

    return {
      totalBookings: allBookings.length,
      pendingCount: pending,
      confirmedCount,
      upcomingCount: confirmedUpcoming,
      completedCount: completed,
      cancelledCount: cancelled,
      totalRevenue: totalEarnings,
      averageBookingValue,
      mostBookedService,
      monthlyTrends,
    };
  },
};
