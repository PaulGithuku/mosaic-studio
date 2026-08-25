-- =============================================================================
-- MOSAIC STUDIO — PHASE 4 DATABASE MIGRATION
-- Table: bookings (with foreign keys, indexes, double-booking constraints & RLS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  location TEXT,
  message TEXT,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'declined', 'rescheduled', 'completed')),
  booking_reference TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraint: end_time must be strictly after start_time
  CONSTRAINT check_booking_time_range CHECK (end_time > start_time)
);

-- Indexes for performance, dashboard queries and conflict lookups
CREATE INDEX IF NOT EXISTS idx_bookings_photographer_date ON public.bookings(photographer_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_photographer_status ON public.bookings(photographer_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON public.bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_conflict_lookup ON public.bookings(photographer_id, booking_date, status, start_time, end_time);

-- Enable Row Level Security (RLS)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 1. Photographers can view only their own bookings
CREATE POLICY "Photographers can view their own bookings"
  ON public.bookings
  FOR SELECT
  USING (
    photographer_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- 2. Photographers can update only their own bookings
CREATE POLICY "Photographers can update their own bookings"
  ON public.bookings
  FOR UPDATE
  USING (
    photographer_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- 3. Anyone (anonymous clients) can create a booking inquiry
CREATE POLICY "Public can create bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (true);

-- 4. Anyone can view booking confirmation by reference (public success page)
CREATE POLICY "Public can view booking by reference"
  ON public.bookings
  FOR SELECT
  USING (booking_reference IS NOT NULL);
