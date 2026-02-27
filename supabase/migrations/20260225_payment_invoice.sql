-- ============================================================
-- Migration: payment_method, paid_at, invoices table,
--            notifications schema fix, bookings extra columns
-- Run this once against your Supabase project.
-- ============================================================

-- ------------------------------------------------------------
-- 1. BOOKINGS — add payment fields + extra audit columns
-- ------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_method TEXT
    CHECK (payment_method IS NULL OR payment_method IN ('cash','bank_transfer','card','other')),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS base_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS addons_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_returned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS pickup_location TEXT,
  ADD COLUMN IF NOT EXISTS dropoff_location TEXT,
  ADD COLUMN IF NOT EXISTS actual_return_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS late_fee_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS damage_reported BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS invoice_url TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT
    CHECK (cancelled_by IS NULL OR cancelled_by IN ('admin','staff','customer')),
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'online'
    CHECK (booking_source IN ('online','manual','api')),
  ADD COLUMN IF NOT EXISTS addons JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by_role TEXT
    CHECK (created_by_role IS NULL OR created_by_role IN ('admin','staff','customer')),
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID;

-- Ensure payment_status CHECK matches our enum (paid, pending, failed, refunded)
-- The existing CHECK might only have 'pending','paid','failed'; add 'refunded' if missing.
-- Safe: drop old constraint and recreate.
DO $$
BEGIN
  ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
  ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_payment_status_check
    CHECK (payment_status IN ('pending','paid','failed','refunded'));
EXCEPTION WHEN others THEN
  NULL; -- ignore if constraint doesn't exist
END $$;

-- bookings_booking_source_check may already exist; safe no-op on conflict
DO $$
BEGIN
  ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_booking_source_check;
  ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_booking_source_check
    CHECK (booking_source IN ('online','manual','api'));
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- ------------------------------------------------------------
-- 2. NOTIFICATIONS — add missing columns
-- ------------------------------------------------------------
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS href TEXT;

-- Existing rows get empty-string title (already defaulted).
-- If the old schema had only 'message' (not 'title') as NOT NULL, this is fine.

-- ------------------------------------------------------------
-- 3. INVOICES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id         UUID        NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID        NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  invoice_no TEXT        NOT NULL,
  pdf_url    TEXT        NOT NULL,   -- storage path (not signed URL)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Customer can read their own invoices (via booking ownership)
DROP POLICY IF EXISTS "customer_read_own_invoices" ON public.invoices;
CREATE POLICY "customer_read_own_invoices"
  ON public.invoices FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE user_id = auth.uid()
    )
  );

-- Admin/staff can read all invoices
DROP POLICY IF EXISTS "admin_staff_read_all_invoices" ON public.invoices;
CREATE POLICY "admin_staff_read_all_invoices"
  ON public.invoices FOR SELECT
  USING (public.is_role(ARRAY['admin','staff']));

-- Insert is done server-side with service role only (no RLS insert policy needed)
-- If you need an insert policy for direct client use, add one here.

-- ------------------------------------------------------------
-- 4. STORAGE BUCKET (manual step — cannot be done via SQL)
-- ------------------------------------------------------------
-- ACTION REQUIRED: Go to Supabase Dashboard → Storage → Create bucket named "invoices"
-- Set bucket to PRIVATE (not public). The API uses signed URLs (15-min expiry).
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 5. INDEX for invoices
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices(booking_id);

-- Done!
