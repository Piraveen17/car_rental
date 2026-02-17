-- Production hardening + schema alignment
-- Apply on Supabase Postgres.

BEGIN;

-- Needed for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

/* -------------------------------------------------------------------------- */
/* BOOKINGS: align columns + status enum + constraints                          */
/* -------------------------------------------------------------------------- */

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS base_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS addons_amount numeric NOT NULL DEFAULT 0;

-- Ensure start < end
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_start_before_end'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_start_before_end CHECK (start_date < end_date);
  END IF;
END $$;

-- Replace status check to include REJECTED
DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c
  FROM pg_constraint
  WHERE conrelid = 'public.bookings'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%in%'
  LIMIT 1;

  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT %I', c);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_status_check'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_status_check
      CHECK (status IN ('pending','confirmed','rejected','cancelled','completed'));
  END IF;
END $$;

-- DB-level overlap prevention for CONFIRMED bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_no_overlap_confirmed'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_no_overlap_confirmed
      EXCLUDE USING gist (
        car_id WITH =,
        tstzrange(start_date, end_date, '[)') WITH &&
      ) WHERE (status = 'confirmed');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_car_status_dates
  ON public.bookings (car_id, status, start_date, end_date);

/* -------------------------------------------------------------------------- */
/* NOTIFICATIONS: migrate to db/notifications.sql baseline                      */
/* -------------------------------------------------------------------------- */

-- Add new columns
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS href text,
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

-- Backfill from legacy columns if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'message'
  ) THEN
    UPDATE public.notifications
      SET title = COALESCE(title, 'Notification'),
          body = COALESCE(body, message),
          is_read = COALESCE(is_read, "read", false);
  END IF;
END $$;

-- Drop legacy trigger/columns (safe IF EXISTS)
DROP TRIGGER IF EXISTS on_notifications_updated ON public.notifications;
ALTER TABLE public.notifications
  DROP COLUMN IF EXISTS message,
  DROP COLUMN IF EXISTS "read",
  DROP COLUMN IF EXISTS metadata,
  DROP COLUMN IF EXISTS updated_at;

-- Ensure no NULLs before NOT NULL constraints
UPDATE public.notifications
  SET title = COALESCE(title, 'Notification'),
      body = COALESCE(body, ''),
      is_read = COALESCE(is_read, false);

-- Ensure defaults/indexes
ALTER TABLE public.notifications
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN body SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications (user_id, is_read);

/* -------------------------------------------------------------------------- */
/* USERS: prevent role escalation via profile update                            */
/* -------------------------------------------------------------------------- */

CREATE OR REPLACE FUNCTION public.prevent_role_self_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE jwt_role text;
BEGIN
  jwt_role := current_setting('request.jwt.claim.role', true);

  -- allow service role
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- allow admins (via is_role)
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_role(ARRAY['admin']) THEN
    RAISE EXCEPTION 'Role changes are not allowed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_self_change ON public.users;
CREATE TRIGGER trg_prevent_role_self_change
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE PROCEDURE public.prevent_role_self_change();

/* -------------------------------------------------------------------------- */
/* INVOICES: RLS policies to prevent IDOR                                       */
/* -------------------------------------------------------------------------- */

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invoices_select_own_or_staff ON public.invoices;
CREATE POLICY invoices_select_own_or_staff ON public.invoices
FOR SELECT
USING (
  public.is_role(ARRAY['admin','staff'])
  OR EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = invoices.booking_id
      AND b.user_id = auth.uid()
  )
);

-- inserts are done by service role (API) or staff/admin
DROP POLICY IF EXISTS invoices_insert_staff_only ON public.invoices;
CREATE POLICY invoices_insert_staff_only ON public.invoices
FOR INSERT
WITH CHECK (public.is_role(ARRAY['admin','staff']));

COMMIT;
