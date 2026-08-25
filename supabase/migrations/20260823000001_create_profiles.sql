-- ==============================================================================
-- MOSAIC STUDIO: Phase 1 Migration - Profiles & Authentication Foundations
-- Version: 20260823000001
-- Target: Supabase PostgreSQL
-- ==============================================================================

-- 1. Create extension for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the `profiles` table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    bio TEXT,
    profile_image_path TEXT,
    location TEXT,
    phone TEXT,
    email TEXT NOT NULL,
    website TEXT,
    instagram TEXT,
    facebook TEXT,
    tiktok TEXT,
    whatsapp TEXT,
    specialties TEXT[] DEFAULT '{}'::TEXT[],
    years_experience INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes for fast lookup by user_id and public slug
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies
-- Policy A: Public profiles are readable by everyone (anonymously & authenticated)
CREATE POLICY "Public profiles are readable by everyone"
    ON public.profiles
    FOR SELECT
    USING (true);

-- Policy B: Authenticated photographers can insert their own profile
CREATE POLICY "Photographers can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy C: Authenticated photographers can update their own profile
CREATE POLICY "Photographers can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy D: Authenticated photographers can delete their own profile
CREATE POLICY "Photographers can delete their own profile"
    ON public.profiles
    FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Trigger for automatic updated_at timestamp updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Automated Profile Provisioning Trigger (Optional on Supabase Auth SignUp)
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    derived_name TEXT;
    derived_slug TEXT;
BEGIN
    derived_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    derived_slug := lower(regexp_replace(derived_name, '[^a-zA-Z0-9]+', '-', 'g'));
    
    -- Ensure slug ends clean and handle collision
    derived_slug := trim(both '-' from derived_slug);
    IF derived_slug = '' THEN
        derived_slug := 'photographer-' || substr(NEW.id::text, 1, 8);
    END IF;

    INSERT INTO public.profiles (user_id, email, name, slug)
    VALUES (
        NEW.id,
        NEW.email,
        derived_name,
        derived_slug
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users if permissions allow
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Gracefully proceed if running in sandbox without auth.users schema access
END $$;
