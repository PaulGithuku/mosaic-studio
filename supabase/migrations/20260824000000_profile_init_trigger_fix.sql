-- ==============================================================================
-- MOSAIC STUDIO: Phase 6 Migration - Profile Initialization & Robust Trigger Fix
-- Version: 20260824000000
-- Target: Supabase PostgreSQL
-- ==============================================================================

-- 1. Ensure public.profiles table has unique user_id constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 2. Enhanced Trigger function with collision prevention and safe fallback
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    derived_name TEXT;
    base_slug TEXT;
    unique_slug TEXT;
    slug_counter INTEGER := 1;
BEGIN
    -- Extract display name or derive from email prefix
    derived_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Photographer');
    
    -- Clean base slug
    base_slug := lower(regexp_replace(derived_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    
    IF base_slug = '' THEN
        base_slug := 'photographer-' || substr(NEW.id::text, 1, 8);
    END IF;

    unique_slug := base_slug;

    -- Ensure unique slug if collision occurs
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = unique_slug AND user_id <> NEW.id) LOOP
        unique_slug := base_slug || '-' || slug_counter;
        slug_counter := slug_counter + 1;
    END LOOP;

    -- Insert or update profile
    INSERT INTO public.profiles (
        user_id,
        email,
        name,
        slug,
        specialties,
        years_experience,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        LOWER(NEW.email),
        derived_name,
        unique_slug,
        ARRAY['Portrait', 'Editorial']::TEXT[],
        1,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW()
    WHERE public.profiles.user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Rebind trigger to auth.users if permissions allow
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT OR UPDATE OF email ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 4. Backfill any existing Supabase Auth users that currently lack a profile
DO $$
DECLARE
    user_record RECORD;
    derived_name TEXT;
    base_slug TEXT;
    unique_slug TEXT;
    slug_counter INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        FOR user_record IN 
            SELECT u.id, u.email, u.raw_user_meta_data 
            FROM auth.users u
            LEFT JOIN public.profiles p ON p.user_id = u.id
            WHERE p.id IS NULL
        LOOP
            derived_name := COALESCE(user_record.raw_user_meta_data->>'name', split_part(user_record.email, '@', 1), 'Photographer');
            base_slug := lower(regexp_replace(derived_name, '[^a-zA-Z0-9]+', '-', 'g'));
            base_slug := trim(both '-' from base_slug);
            IF base_slug = '' THEN
                base_slug := 'photographer-' || substr(user_record.id::text, 1, 8);
            END IF;
            
            unique_slug := base_slug;
            slug_counter := 1;
            WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = unique_slug) LOOP
                unique_slug := base_slug || '-' || slug_counter;
                slug_counter := slug_counter + 1;
            END LOOP;

            INSERT INTO public.profiles (user_id, email, name, slug, specialties, years_experience)
            VALUES (user_record.id, LOWER(user_record.email), derived_name, unique_slug, ARRAY['Portrait', 'Editorial']::TEXT[], 1)
            ON CONFLICT (user_id) DO NOTHING;
        END LOOP;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
