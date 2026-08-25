import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'photographer' | 'admin' | 'client';
  createdAt: string;
}

export interface Profile {
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

// Backward compatibility alias for UI components
export type Photographer = Profile;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthResponseData {
  token: string;
  user: User;
  profile: Profile | null;
  photographer?: Profile | null;
}

export interface AuthContextType {
  user: User | null;
  currentUser: User | null; // alias
  profile: Profile | null;
  photographer: Profile | null; // alias
  session: Session | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: RegisterCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>; // alias
  register: (credentials: RegisterCredentials) => Promise<void>; // alias
  logout: () => Promise<void>; // alias
  refreshUser: () => Promise<void>;
}
