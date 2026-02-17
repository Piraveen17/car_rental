BEGIN;

-- -------------------------------------------------------------------
-- Extensions needed for overlap constraint
-- -------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- -------------------------------------------------------------------
-- 1) SECURITY: stop "first user becomes admin" bootstrap
--    (new signups become customer; promote admin manually via SQL)
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- -------------------------------------------------------------------
-- 2) SECURITY: prevent role escalation via profile update
--    (allows service_role + SQL editor; blocks normal users unless admin)
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_role_self_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE jwt_role text;
BEGIN
  jwt_role := current_setting('request.jwt.claim.role', true);

  -- allow migrations / SQL editor (no JWT context)
  IF jwt_role IS NULL OR jwt_role = '' THEN
    RETURN NEW;
  END IF;

  -- allow service role
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- block non-admin role changes
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

-- -------------------------------------------------------------------
-- 3) CARS: add min/max rental days (used by booking POST)
-- -------------------------------------------------------------------
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS min_days int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_days int DEFAULT 30;

-- -------------------------------------------------------------------
-- 4) AVAILABILITY: car_unavailable table (maintenance blocks all)
--    Use timestamptz to match app API comparisons
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.car_unavailable (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id uuid REFERENCES public.cars(car_id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  reason text DEFAULT 'maintenance',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_car_unavailable_car_id ON public.car_unavailable(car_id);
CREATE INDEX IF NOT EXISTS idx_car_unavailable_dates ON public.car_unavailable(car_id, start_date, end_date);

ALTER TABLE public.car_unavailable ENABLE ROW LEVEL SECURITY;

-- Policies (ensure INSERT/UPDATE works: need WITH CHECK)
DROP POLICY IF EXISTS "Public read unavailable" ON public.car_unavailable;
DROP POLICY IF EXISTS "Staff insert unavailable" ON public.car_unavailable;
DROP POLICY IF EXISTS "Staff update unavailable" ON public.car_unavailable;
DROP POLICY IF EXISTS "Staff delete unavailable" ON public.car_unavailable;

CREATE POLICY "Public read unavailable"
ON public.car_unavailable FOR SELECT
USING (true);

CREATE POLICY "Staff insert unavailable"
ON public.car_unavailable FOR INSERT
WITH CHECK (public.is_role(ARRAY['admin','staff']));

CREATE POLICY "Staff update unavailable"
ON public.car_unavailable FOR UPDATE
USING (public.is_role(ARRAY['admin','staff']))
WITH CHECK (public.is_role(ARRAY['admin','staff']));

CREATE POLICY "Staff delete unavailable"
ON public.car_unavailable FOR DELETE
USING (public.is_role(ARRAY['admin','staff']));

-- -------------------------------------------------------------------
-- 5) ADDONS + BOOKING_ADDONS (used by booking creation + invoice)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.addons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  pricing_type text NOT NULL CHECK (pricing_type IN ('per_day', 'per_unit', 'fixed')),
  price numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

INSERT INTO public.addons (code, name, pricing_type, price) VALUES
('driver', 'Chauffeur Service', 'per_day', 50.00),
('extra_km', 'Extra KM Bundle (100km)', 'per_unit', 20.00),
('delivery', 'Delivery & Pickup', 'fixed', 30.00)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read addons" ON public.addons;
DROP POLICY IF EXISTS "Staff insert addons" ON public.addons;
DROP POLICY IF EXISTS "Staff update addons" ON public.addons;
DROP POLICY IF EXISTS "Staff delete addons" ON public.addons;

CREATE POLICY "Public read addons"
ON public.addons FOR SELECT
USING (true);

CREATE POLICY "Staff insert addons"
ON public.addons FOR INSERT
WITH CHECK (public.is_role(ARRAY['admin','staff']));

CREATE POLICY "Staff update addons"
ON public.addons FOR UPDATE
USING (public.is_role(ARRAY['admin','staff']))
WITH CHECK (public.is_role(ARRAY['admin','staff']));

CREATE POLICY "Staff delete addons"
ON public.addons FOR DELETE
USING (public.is_role(ARRAY['admin','staff']));

CREATE TABLE IF NOT EXISTS public.booking_addons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  addon_id uuid REFERENCES public.addons(id),
  qty int NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_booking_addons_booking_id ON public.booking_addons(booking_id);

ALTER TABLE public.booking_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own booking addons" ON public.booking_addons;
DROP POLICY IF EXISTS "Staff read all booking addons" ON public.booking_addons;
DROP POLICY IF EXISTS "Users insert booking addons" ON public.booking_addons;

CREATE POLICY "Users read own booking addons"
ON public.booking_addons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_addons.booking_id
      AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Staff read all booking addons"
ON public.booking_addons FOR SELECT
USING (public.is_role(ARRAY['admin','staff']));

CREATE POLICY "Users insert booking addons"
ON public.booking_addons FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_addons.booking_id
      AND b.user_id = auth.uid()
  )
);

-- -------------------------------------------------------------------
-- 6) BOOKINGS: add base/addons amounts and allow REJECTED status
-- -------------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS base_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS addons_amount numeric NOT NULL DEFAULT 0;

-- ensure start < end
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

-- replace status constraint to include rejected
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

-- DB-level confirmed overlap prevention (race-proof)
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

-- -------------------------------------------------------------------
-- 7) INVOICES table (invoice API expects it)
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  invoice_no text UNIQUE NOT NULL,
  pdf_url text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices(booking_id);

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

DROP POLICY IF EXISTS invoices_insert_staff_only ON public.invoices;
CREATE POLICY invoices_insert_staff_only ON public.invoices
FOR INSERT
WITH CHECK (public.is_role(ARRAY['admin','staff']));

-- -------------------------------------------------------------------
-- 8) NOTIFICATIONS: add production fields (keep legacy columns for now)
-- -------------------------------------------------------------------
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS href text,
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

-- backfill from legacy columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='notifications' AND column_name='message'
  ) THEN
    UPDATE public.notifications
    SET title = COALESCE(title, 'Notification'),
        body  = COALESCE(body, message),
        is_read = COALESCE(is_read, "read", false);
  END IF;
END $$;

UPDATE public.notifications
SET title = COALESCE(title, 'Notification'),
    body  = COALESCE(body, ''),
    is_read = COALESCE(is_read, false);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);

COMMIT;
