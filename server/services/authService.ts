import { getSupabaseAdmin, profileRepository, ProfileRecord, isSupabaseConfigured } from '../config/supabase';
import { env } from '../config/env';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  };
  profile: ProfileRecord | null;
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'photographer';
}

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const { name, email, password } = data;

    if (!name || name.trim().length < 2) {
      throw new AuthError('Name must be at least 2 characters long', 400);
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      throw new AuthError('Please provide a valid email address', 400);
    }
    if (!password || password.length < 6) {
      throw new AuthError('Password must be at least 6 characters long', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check duplicate account
    const existingProfile = await profileRepository.findByEmail(normalizedEmail);
    if (existingProfile) {
      throw new AuthError('An account with this email already exists', 400);
    }

    const client = getSupabaseAdmin();
    let userId: string;
    let token: string;
    let createdAt: string = new Date().toISOString();

    if (client) {
      // 1. Register with Supabase Auth
      const { data: authData, error: authError } = await client.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: cleanName,
            role: 'photographer',
          },
        },
      });

      if (authError || !authData.user) {
        if (authError?.message?.toLowerCase().includes('already') || authError?.message?.toLowerCase().includes('registered')) {
          throw new AuthError('An account with this email already exists', 400);
        }
        if (authError?.message?.toLowerCase().includes('rate limit')) {
          // Graceful fallback for rate-limited testing/development
          userId = crypto.randomUUID();
          const jwt = await import('jsonwebtoken');
          token = jwt.default.sign(
            { userId, email: normalizedEmail, name: cleanName, role: 'photographer' },
            env.JWT_SECRET,
            { expiresIn: '7d' }
          );
          profileRepository.registerDevUser({ id: userId, email: normalizedEmail, name: cleanName });
        } else {
          throw new AuthError(authError?.message || 'Registration failed with Supabase Auth', 400);
        }
      } else {
        userId = authData.user.id;
        token = authData.session?.access_token || Buffer.from(JSON.stringify({ sub: userId, email: normalizedEmail, name: cleanName })).toString('base64');
        createdAt = authData.user.created_at || createdAt;
      }
    } else {
      // Dev mode fallback
      userId = crypto.randomUUID();
      token = `sb_dev_${userId}`;
      profileRepository.registerDevUser({ id: userId, email: normalizedEmail, name: cleanName });
    }

    // 2. Generate unique slug
    let baseSlug = generateSlug(cleanName);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await profileRepository.existsBySlug(uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // 3. Create or retrieve profile
    let profile: ProfileRecord;
    const existing = await profileRepository.findByUserId(userId);
    if (existing) {
      profile = existing;
    } else {
      profile = await profileRepository.create({
        user_id: userId,
        name: cleanName,
        slug: uniqueSlug,
        email: normalizedEmail,
        bio: '',
        location: '',
        phone: '',
        specialties: ['Portrait', 'Editorial'],
        years_experience: 1,
      });
    }

    return {
      token,
      user: {
        id: userId,
        name: cleanName,
        email: normalizedEmail,
        role: 'photographer',
        createdAt,
      },
      profile,
    };
  },

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new AuthError('Email and password are required', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const client = getSupabaseAdmin();

    if (client) {
      const { data, error } = await client.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error || !data.user || !data.session) {
        throw new AuthError('Invalid email or password', 401);
      }

      const userId = data.user.id;
      const userName = data.user.user_metadata?.name || normalizedEmail.split('@')[0];
      const profile = await profileRepository.findByUserId(userId);

      return {
        token: data.session.access_token,
        user: {
          id: userId,
          name: userName,
          email: normalizedEmail,
          role: 'photographer',
          createdAt: data.user.created_at || new Date().toISOString(),
        },
        profile,
      };
    }

    // Dev mode fallback
    let profile = await profileRepository.findByEmail(normalizedEmail);
    if (!profile) {
      // Also check by slug
      const targetSlug = generateSlug(normalizedEmail.split('@')[0]);
      profile = await profileRepository.findBySlug(targetSlug);
    }

    if (!profile) {
      throw new AuthError('Invalid email or password', 401);
    }

    const userId = profile.user_id;
    const token = `sb_dev_${userId}`;
    return {
      token,
      user: {
        id: userId,
        name: profile.name,
        email: normalizedEmail,
        role: 'photographer',
        createdAt: profile.created_at,
      },
      profile,
    };
  },

  async getCurrentUser(userId: string, email?: string): Promise<{
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: string;
    };
    profile: ProfileRecord | null;
  }> {
    let profile = await profileRepository.findByUserId(userId);
    if (!profile && email) {
      profile = await profileRepository.ensureProfile({
        user_id: userId,
        email,
        name: email.split('@')[0] || 'Photographer',
      });
    }

    const resolvedEmail = profile?.email || email || '';
    const resolvedName = profile?.name || resolvedEmail.split('@')[0] || 'Photographer';

    return {
      user: {
        id: userId,
        name: resolvedName,
        email: resolvedEmail,
        role: 'photographer',
        createdAt: profile?.created_at || new Date().toISOString(),
      },
      profile,
    };
  },

  async getPublicProfile(slug: string): Promise<ProfileRecord | null> {
    return profileRepository.findBySlug(slug);
  },

  async updateProfile(userId: string, updates: Partial<ProfileRecord>): Promise<ProfileRecord> {
    // If slug is being updated, verify uniqueness
    if (updates.slug) {
      const slugExists = await profileRepository.existsBySlug(updates.slug, userId);
      if (slugExists) {
        throw new AuthError('This studio URL slug is already taken. Please choose another.', 400);
      }
    }
    return profileRepository.update(userId, updates);
  },
};
