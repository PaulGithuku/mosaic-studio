import { api, setStoredToken, removeStoredToken, getStoredToken } from './api';
import { supabase, isClientSupabaseConfigured } from '../lib/supabase';
import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponseData,
  User,
  Profile,
} from '../types/auth';

export const authService = {
  async register(credentials: RegisterCredentials): Promise<AuthResponseData> {
    if (isClientSupabaseConfigured()) {
      // 1. Supabase client-side Auth sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
        options: {
          data: {
            name: credentials.name.trim(),
            role: 'photographer',
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create account with Supabase Auth');
      }

      const token = authData.session?.access_token || `sb_${authData.user.id}`;
      setStoredToken(token);

      // 2. Fetch or initialize profile via API backend
      try {
        const profileRes = await api.get<{ success: boolean; data: { user: User; profile: Profile } }>('/auth/me');
        return {
          token,
          user: profileRes.data.data.user,
          profile: profileRes.data.data.profile,
          photographer: profileRes.data.data.profile,
        };
      } catch {
        // Fallback profile if backend is resolving asynchronously
        const cleanSlug = credentials.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
        const fallbackProfile: Profile = {
          id: crypto.randomUUID(),
          user_id: authData.user.id,
          name: credentials.name.trim(),
          slug: cleanSlug,
          email: credentials.email.trim().toLowerCase(),
          specialties: ['Portrait', 'Editorial'],
          years_experience: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return {
          token,
          user: {
            id: authData.user.id,
            name: credentials.name.trim(),
            email: credentials.email.trim().toLowerCase(),
            role: 'photographer',
            createdAt: authData.user.created_at || new Date().toISOString(),
          },
          profile: fallbackProfile,
          photographer: fallbackProfile,
        };
      }
    }

    // Direct REST API registration
    const response = await api.post<{ success: boolean; data: AuthResponseData; message?: string }>(
      '/auth/register',
      credentials
    );
    const data = response.data.data;
    if (data.token) {
      setStoredToken(data.token);
    }
    return {
      ...data,
      profile: data.profile || (data as any).photographer || null,
      photographer: data.profile || (data as any).photographer || null,
    };
  },

  async login(credentials: LoginCredentials): Promise<AuthResponseData> {
    if (isClientSupabaseConfigured()) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      });

      if (authError || !authData.user || !authData.session) {
        throw new Error(authError?.message || 'Invalid email or password');
      }

      const token = authData.session.access_token;
      setStoredToken(token);

      const profileRes = await api.get<{ success: boolean; data: { user: User; profile: Profile } }>('/auth/me');
      return {
        token,
        user: profileRes.data.data.user,
        profile: profileRes.data.data.profile,
        photographer: profileRes.data.data.profile,
      };
    }

    const response = await api.post<{ success: boolean; data: AuthResponseData; message?: string }>(
      '/auth/login',
      credentials
    );
    const data = response.data.data;
    if (data.token) {
      setStoredToken(data.token);
    }
    return {
      ...data,
      profile: data.profile || (data as any).photographer || null,
      photographer: data.profile || (data as any).photographer || null,
    };
  },

  async logout(): Promise<void> {
    try {
      if (isClientSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      removeStoredToken();
    }
  },

  async getCurrentUser(): Promise<{ user: User; profile: Profile | null; photographer: Profile | null }> {
    const response = await api.get<{
      success: boolean;
      data: { user: User; profile?: Profile | null; photographer?: Profile | null };
    }>('/auth/me');
    const profile = response.data.data.profile || response.data.data.photographer || null;
    return {
      user: response.data.data.user,
      profile,
      photographer: profile,
    };
  },

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    const response = await api.put<{ success: boolean; data: Profile; message?: string }>(
      '/photographers/profile',
      updates
    );
    return response.data.data;
  },

  async getPublicProfile(slug: string): Promise<Profile> {
    const response = await api.get<{ success: boolean; data: Profile }>(`/photographers/${slug}`);
    return response.data.data;
  },
};
