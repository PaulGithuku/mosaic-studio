/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || metaEnv.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isClientSupabaseConfigured = (): boolean => {
  return !!(
    metaEnv.VITE_SUPABASE_URL &&
    (metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || metaEnv.VITE_SUPABASE_ANON_KEY) &&
    !metaEnv.VITE_SUPABASE_URL.includes('placeholder')
  );
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
