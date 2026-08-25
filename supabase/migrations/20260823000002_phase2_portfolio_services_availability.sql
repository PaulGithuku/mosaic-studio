-- ==============================================================================
-- MOSAIC STUDIO: Phase 2 Migration - Portfolio, Categories, Services & Availability
-- Version: 20260823000002
-- Target: Supabase PostgreSQL
-- ==============================================================================

-- 1. Create `portfolio_categories` table
CREATE TABLE IF NOT EXISTS public.portfolio_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photographer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_photographer_category_slug UNIQUE (photographer_id, slug)
);

-- Indexes for portfolio_categories
CREATE INDEX IF NOT EXISTS idx_categories_photographer_id ON public.portfolio_categories(photographer_id);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.portfolio_categories(photographer_id, display_order);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.portfolio_categories(photographer_id, active);

-- 2. Create `portfolio_images` table
CREATE TABLE IF NOT EXISTS public.portfolio_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photographer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.portfolio_categories(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    featured BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for portfolio_images
CREATE INDEX IF NOT EXISTS idx_portfolio_images_photographer_id ON public.portfolio_images(photographer_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_images_category_id ON public.portfolio_images(category_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_images_featured ON public.portfolio_images(photographer_id, featured);
CREATE INDEX IF NOT EXISTS idx_portfolio_images_display_order ON public.portfolio_images(photographer_id, display_order);

-- 3. Create `services` table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photographer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    category TEXT,
    featured BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for services
CREATE INDEX IF NOT EXISTS idx_services_photographer_id ON public.services(photographer_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(photographer_id, active);
CREATE INDEX IF NOT EXISTS idx_services_featured ON public.services(photographer_id, featured);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON public.services(photographer_id, display_order);

-- 4. Create `availability` table
CREATE TABLE IF NOT EXISTS public.availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photographer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '17:00:00',
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_photographer_day_of_week UNIQUE (photographer_id, day_of_week),
    CONSTRAINT chk_availability_time_order CHECK (start_time < end_time)
);

-- Indexes for availability
CREATE INDEX IF NOT EXISTS idx_availability_photographer_id ON public.availability(photographer_id);
CREATE INDEX IF NOT EXISTS idx_availability_day_of_week ON public.availability(photographer_id, day_of_week);

-- 5. Automatic updated_at Triggers
DROP TRIGGER IF EXISTS set_portfolio_categories_updated_at ON public.portfolio_categories;
CREATE TRIGGER set_portfolio_categories_updated_at
    BEFORE UPDATE ON public.portfolio_categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_portfolio_images_updated_at ON public.portfolio_images;
CREATE TRIGGER set_portfolio_images_updated_at
    BEFORE UPDATE ON public.portfolio_images
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_services_updated_at ON public.services;
CREATE TRIGGER set_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_availability_updated_at ON public.availability;
CREATE TRIGGER set_availability_updated_at
    BEFORE UPDATE ON public.availability
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Enable Row Level Security (RLS) on all Phase 2 tables
ALTER TABLE public.portfolio_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- 7. Row Level Security Policies

-- Categories RLS
CREATE POLICY "Public can view active categories"
    ON public.portfolio_categories FOR SELECT
    USING (true);

CREATE POLICY "Photographers can insert categories for their profile"
    ON public.portfolio_categories FOR INSERT
    WITH CHECK (
        photographer_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Photographers can update their own categories"
    ON public.portfolio_categories FOR UPDATE
    USING (
        photographer_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        photographer_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Photographers can delete their own categories"
    ON public.portfolio_categories FOR DELETE
    USING (
        photographer_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- Portfolio Images RLS
CREATE POLICY "Public can view portfolio images"
    ON public.portfolio_images FOR SELECT
    USING (true);

CREATE POLICY "Photographers can insert portfolio images for their profile"
    ON public.portfolio_images FOR INSERT
    WITH CHECK (
        photographer_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Photographers can update their own portfolio images"
    ON public.portfolio_images FOR UPDATE
    USING (
        photographer_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        photographer_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Photographers can delete their own portfolio images"
    ON public.portfolio_images FOR DELETE
    USING (
        photographer_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- Services RLS
CREATE POLICY "Public can view active services"
    ON public.services FOR SELECT
    USING (true);

CREATE POLICY "Photographers can insert services for their profile"
    ON public.services FOR INSERT
    WITH CHECK (
        photographer_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Photographers can update their own services"
    ON public.services FOR UPDATE
    USING (
        photographer_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        photographer_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Photographers can delete their own services"
    ON public.services FOR DELETE
    USING (
        photographer_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- Availability RLS
CREATE POLICY "Public can view enabled availability"
    ON public.availability FOR SELECT
    USING (true);

CREATE POLICY "Photographers can insert availability for their profile"
    ON public.availability FOR INSERT
    WITH CHECK (
        photographer_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Photographers can update their own availability"
    ON public.availability FOR UPDATE
    USING (
        photographer_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        photographer_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Photographers can delete their own availability"
    ON public.availability FOR DELETE
    USING (
        photographer_id IN (
            SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
    );

-- 8. Storage Setup (Buckets & Policies for Supabase Storage)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('profile-images', 'profile-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
    ('portfolio-images', 'portfolio-images', true, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies
-- Allow public read access to objects in profile-images and portfolio-images
CREATE POLICY "Public Read Profile Images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-images');

CREATE POLICY "Public Read Portfolio Images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'portfolio-images');

-- Allow authenticated users to upload to profile-images if path starts with their user ID or profile ID
CREATE POLICY "Photographers Upload Profile Images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'profile-images'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Photographers Upload Portfolio Images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'portfolio-images'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Photographers Delete Profile Images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'profile-images'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Photographers Delete Portfolio Images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'portfolio-images'
        AND auth.role() = 'authenticated'
    );
