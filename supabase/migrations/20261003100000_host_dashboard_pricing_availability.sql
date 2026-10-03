-- ==============================================================================
-- Migration: Host Dashboard & Calendar (Pricing, Discounts, Availability, Policies)
-- Description: Adds all required columns to 'properties' and 'bookings' tables
-- 100% Idempotent: Uses IF NOT EXISTS, safe to run multiple times without errors.
-- ==============================================================================

-- 1. PROPERTIES: Pricing, Discounts, Availability, and Policies
ALTER TABLE public.properties
  -- Instant Booking & Listing Status
  ADD COLUMN IF NOT EXISTS instant_booking BOOLEAN DEFAULT true,
  
  -- Pricing (Tab 1)
  ADD COLUMN IF NOT EXISTS weekend_price NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS weekend_pct INTEGER DEFAULT 40,
  ADD COLUMN IF NOT EXISTS cleaning_fee NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cleaning_policy TEXT DEFAULT 'included',
  
  -- Discounts (Tab 2)
  ADD COLUMN IF NOT EXISTS discounts JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS first_bookings_discount_pct INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS last_minute_discount_pct INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS three_nights_discount_pct INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS weekly_discount_pct INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS monthly_discount_pct INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS custom_discounts JSONB DEFAULT '[]'::jsonb,
  
  -- Availability & Rules (Tab 3)
  ADD COLUMN IF NOT EXISTS check_in_time TEXT DEFAULT '14:00',
  ADD COLUMN IF NOT EXISTS check_out_time TEXT DEFAULT '11:00',
  ADD COLUMN IF NOT EXISTS minimum_nights INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS maximum_nights INTEGER DEFAULT 365,
  ADD COLUMN IF NOT EXISTS booking_notice TEXT DEFAULT '2 Days',
  ADD COLUMN IF NOT EXISTS preparation_time TEXT DEFAULT '0 Night',
  ADD COLUMN IF NOT EXISTS restrict_checkin TEXT DEFAULT 'Friday',
  ADD COLUMN IF NOT EXISTS restrict_checkout TEXT DEFAULT 'Friday',
  ADD COLUMN IF NOT EXISTS calendar_availability TEXT DEFAULT '12 Months',
  ADD COLUMN IF NOT EXISTS blocked_dates TEXT[] DEFAULT '{}'::text[],
  
  -- Cancellation Policy (Tab 4) & Host Metadata
  ADD COLUMN IF NOT EXISTS cancellation_policy TEXT DEFAULT 'flexible',
  ADD COLUMN IF NOT EXISTS pending_changes JSONB DEFAULT '{}'::jsonb;

-- 2. BOOKINGS: Guest Name and Details (Safe additions)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS guest_name TEXT DEFAULT NULL;

-- 3. INDEXES: Speed up Host Calendar & Dashboard queries
CREATE INDEX IF NOT EXISTS idx_properties_host_id ON public.properties(host_id);
CREATE INDEX IF NOT EXISTS idx_bookings_host_id ON public.bookings(host_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);

-- 4. PERMISSIONS & RLS: Ensure hosts can read & update their properties without restriction
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'properties' 
    AND policyname = 'Hosts can update their own properties'
  ) THEN
    CREATE POLICY "Hosts can update their own properties"
    ON public.properties FOR UPDATE
    TO authenticated
    USING (auth.uid() = host_id)
    WITH CHECK (auth.uid() = host_id);
  END IF;
END $$;

-- 5. RELOAD SCHEMA CACHE: Informs PostgREST of all newly added columns immediately
NOTIFY pgrst, 'reload schema';
