-- ============================================================================
-- Migration: Add missing columns to align SQL schema with TypeScript types
-- Run this in Supabase Dashboard → SQL Editor → Run
-- Safe to run multiple times (uses IF NOT EXISTS / DO blocks)
-- ============================================================================

-- 1. users.nic_passport — National ID / Passport number for identity verification
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS nic_passport text;

-- 2. bookings.cancel_reason — Free-text reason recorded when a booking is cancelled
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cancel_reason text;

-- 3. bookings.cancelled_by — FK to users(id): who performed the cancellation
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cancelled_by uuid references public.users(id) on delete set null;

-- Done ✓
