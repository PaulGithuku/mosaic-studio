import dotenv from 'dotenv';

dotenv.config();

export interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  JWT_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_ANON_KEY: string;
  CLIENT_URL: string;
  SERVER_URL: string;
}

export const env: EnvConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'mosaic-studio-dev-jwt-secret-key-32-chars-long',
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  SERVER_URL: process.env.SERVER_URL || 'http://localhost:3000',
};

// Validate critical configs
if (env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('[SECURITY WARNING] JWT_SECRET is using fallback in production mode. Set JWT_SECRET in environment variables.');
}
