-- ============================================================================
-- DriveEase Car Rental System — Production SQL for Supabase
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for full-text search

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
create table if not exists public.users (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text unique not null,
  name        text,
  phone       text,
  nic_passport text,
  role        text not null default 'customer' check (role in ('admin', 'staff', 'customer')),
  avatar_url  text,
  address     text,
  city        text,
  country     text,
  date_of_birth date,
  license_number text,
  license_expiry date,
  emergency_contact text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================================
-- 2. CARS TABLE
-- ============================================================================
create table if not exists public.cars (
  car_id          uuid default uuid_generate_v4() primary key,
  make            text not null,
  model           text not null,
  year            integer not null,
  price_per_day   numeric(10,2) not null check (price_per_day > 0),
  status          text not null default 'active' check (status in ('active', 'maintenance', 'inactive')),
  seats           integer not null default 5,
  transmission    text not null default 'automatic' check (transmission in ('automatic', 'manual')),
  fuel_type       text not null default 'petrol' check (fuel_type in ('petrol', 'diesel', 'electric', 'hybrid')),
  location        text not null,
  images          text[] not null default '{}',
  features        text[] not null default '{}',
  description     text,
  -- Extended fields
  category        text default 'sedan' check (category in ('sedan', 'suv', 'hatchback', 'luxury', 'sports', 'minivan', 'pickup', 'coupe', 'convertible', 'economy')),
  color           text,
  license_plate   text unique,
  vin             text unique,
  mileage         integer default 0,
  min_rental_days integer not null default 1,
  max_rental_days integer not null default 30,
  security_deposit numeric(10,2) default 0,
  rating          numeric(3,2) default 0 check (rating >= 0 and rating <= 5),
  review_count    integer default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================================
-- 3. CAR UNAVAILABLE TABLE (admin-managed blocks)
-- ============================================================================
create table if not exists public.car_unavailable (
  id          uuid default uuid_generate_v4() primary key,
  car_id      uuid references public.cars(car_id) on delete cascade not null,
  start_date  date not null,
  end_date    date not null,
  reason      text,
  type        text default 'maintenance' check (type in ('maintenance', 'reserved', 'other')),
  created_by  uuid references public.users(id),
  created_at  timestamptz not null default now(),
  check (end_date > start_date)
);

-- ============================================================================
-- 4. BOOKINGS TABLE
-- ============================================================================
create table if not exists public.bookings (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.users(id) on delete restrict not null,
  car_id          uuid references public.cars(car_id) on delete restrict not null,
  start_date      date not null,
  end_date        date not null,
  status          text not null default 'pending' 
                    check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'rejected')),
  payment_status  text not null default 'pending' 
                    check (payment_status in ('pending', 'paid', 'refunded', 'failed')),
  base_amount     numeric(10,2) not null default 0 check (base_amount >= 0),
  addons_amount   numeric(10,2) not null default 0 check (addons_amount >= 0),
  total_amount    numeric(10,2) not null default 0 check (total_amount >= 0),
  deposit_amount  numeric(10,2) default 0,
  deposit_returned boolean default false,
  addons          jsonb,
  notes           text,
  admin_note      text,
  cancel_reason   text,
  cancelled_by    uuid references public.users(id) on delete set null,
  pickup_location text,
  dropoff_location text,
  actual_return_date date,
  late_fee_amount numeric(10,2) default 0,
  damage_reported boolean default false,
  booking_source  text default 'online' check (booking_source in ('online', 'manual', 'api')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (end_date > start_date)
);

-- ============================================================================
-- 5. MAINTENANCE TABLE
-- ============================================================================
create table if not exists public.maintenance (
  id              uuid default uuid_generate_v4() primary key,
  car_id          uuid references public.cars(car_id) on delete cascade not null,
  type            text not null default 'repair' 
                    check (type in ('oil_change', 'tire_rotation', 'brake_service', 'engine_repair', 
                                   'transmission', 'electrical', 'body_work', 'inspection', 'repair', 'other')),
  description     text not null,
  status          text not null default 'pending' 
                    check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  start_date      date not null,
  end_date        date,
  estimated_cost  numeric(10,2) default 0,
  actual_cost     numeric(10,2),
  completed_date  date,
  mileage_at_service integer,
  service_provider text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================================
-- 6. PAYMENTS TABLE
-- ============================================================================
create table if not exists public.payments (
  id              uuid default uuid_generate_v4() primary key,
  booking_id      uuid references public.bookings(id) on delete cascade not null,
  user_id         uuid references public.users(id) on delete restrict not null,
  amount          numeric(10,2) not null check (amount > 0),
  status          text not null default 'pending' 
                    check (status in ('pending', 'completed', 'failed', 'refunded')),
  method          text default 'card' check (method in ('card', 'bank', 'cash', 'online')),
  transaction_id  text unique,
  gateway_ref     text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================================
-- 7. REVIEWS TABLE
-- ============================================================================
create table if not exists public.reviews (
  id          uuid default uuid_generate_v4() primary key,
  car_id      uuid references public.cars(car_id) on delete cascade not null,
  user_id     uuid references public.users(id) on delete cascade not null,
  booking_id  uuid references public.bookings(id) on delete cascade not null,
  rating      integer not null check (rating >= 1 and rating <= 5),
  comment     text,
  is_verified boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (booking_id)  -- one review per booking
);

-- ============================================================================
-- 8. NOTIFICATIONS TABLE
-- ============================================================================
create table if not exists public.notifications (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.users(id) on delete cascade not null,
  type        text not null,
  title       text not null,
  message     text,
  href        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- 9. DAMAGE REPORTS TABLE
-- ============================================================================
create table if not exists public.damage_reports (
  id              uuid default uuid_generate_v4() primary key,
  booking_id      uuid references public.bookings(id) on delete cascade not null,
  car_id          uuid references public.cars(car_id) on delete cascade not null,
  reported_by     uuid references public.users(id) on delete restrict not null,
  description     text not null,
  severity        text not null default 'minor' check (severity in ('minor', 'moderate', 'major')),
  estimated_repair_cost numeric(10,2) default 0,
  images          text[] default '{}',
  status          text not null default 'pending' check (status in ('pending', 'reviewed', 'repaired')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================================
-- INDEXES (performance)
-- ============================================================================
create index if not exists idx_cars_status on public.cars(status);
create index if not exists idx_cars_location on public.cars(location);
create index if not exists idx_cars_make on public.cars(make);
create index if not exists idx_cars_price on public.cars(price_per_day);

create index if not exists idx_bookings_user_id on public.bookings(user_id);
create index if not exists idx_bookings_car_id on public.bookings(car_id);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_dates on public.bookings(start_date, end_date);
create index if not exists idx_bookings_dates_confirmed on public.bookings(car_id, start_date, end_date) 
  where status = 'confirmed';

create index if not exists idx_maintenance_car_id on public.maintenance(car_id);
create index if not exists idx_maintenance_status on public.maintenance(status);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, read) 
  where read = false;
create index if not exists idx_reviews_car_id on public.reviews(car_id);
create index if not exists idx_car_unavailable_car_id on public.car_unavailable(car_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at columns
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create or replace trigger trg_cars_updated_at
  before update on public.cars
  for each row execute function public.handle_updated_at();

create or replace trigger trg_bookings_updated_at
  before update on public.bookings
  for each row execute function public.handle_updated_at();

create or replace trigger trg_maintenance_updated_at
  before update on public.maintenance
  for each row execute function public.handle_updated_at();

create or replace trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.handle_updated_at();

create or replace trigger trg_damage_reports_updated_at
  before update on public.damage_reports
  for each row execute function public.handle_updated_at();

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  user_count integer;
  assigned_role text;
begin
  -- First user becomes admin automatically
  select count(*) into user_count from public.users;
  if user_count = 0 then
    assigned_role := 'admin';
  else
    assigned_role := coalesce(new.raw_user_meta_data->>'role', 'customer');
    -- Prevent privilege escalation: only allow 'customer' via self-registration
    if assigned_role not in ('customer') then
      assigned_role := 'customer';
    end if;
  end if;

  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    assigned_role
  )
  on conflict (id) do update
    set email = excluded.email,
        name  = coalesce(excluded.name, public.users.name);

  return new;
end;
$$;

create or replace trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Sync car status with maintenance records
create or replace function public.sync_car_maintenance_status()
returns trigger language plpgsql as $$
begin
  -- If creating/updating an in-progress or pending maintenance → set car to 'maintenance'
  if (TG_OP = 'INSERT' or TG_OP = 'UPDATE') then
    if new.status in ('pending', 'in_progress') then
      update public.cars set status = 'maintenance' where car_id = new.car_id;
    end if;
    -- If ALL maintenance for this car is now completed/cancelled → restore to 'active'
    if new.status in ('completed', 'cancelled') then
      if not exists (
        select 1 from public.maintenance 
        where car_id = new.car_id 
          and id != new.id
          and status in ('pending', 'in_progress')
      ) then
        update public.cars set status = 'active' where car_id = new.car_id and status = 'maintenance';
      end if;
    end if;
  end if;

  if TG_OP = 'DELETE' then
    if not exists (
      select 1 from public.maintenance 
      where car_id = old.car_id and status in ('pending', 'in_progress')
    ) then
      update public.cars set status = 'active' where car_id = old.car_id and status = 'maintenance';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

create or replace trigger trg_sync_car_maintenance
  after insert or update or delete on public.maintenance
  for each row execute function public.sync_car_maintenance_status();

-- Auto-update car rating when reviews are added/updated/deleted
create or replace function public.update_car_rating()
returns trigger language plpgsql as $$
declare
  v_car_id uuid;
  v_avg    numeric;
  v_count  integer;
begin
  v_car_id := coalesce(new.car_id, old.car_id);
  select avg(rating), count(*)
    into v_avg, v_count
    from public.reviews
   where car_id = v_car_id;

  update public.cars
    set rating       = coalesce(round(v_avg, 2), 0),
        review_count = coalesce(v_count, 0)
  where car_id = v_car_id;

  return coalesce(new, old);
end;
$$;

create or replace trigger trg_update_car_rating
  after insert or update or delete on public.reviews
  for each row execute function public.update_car_rating();

-- Prevent booking overlaps at DB level (last line of defense)
create or replace function public.check_booking_overlap()
returns trigger language plpgsql as $$
begin
  -- Only enforce for 'confirmed' bookings
  if new.status = 'confirmed' then
    -- Check overlap with other confirmed bookings for same car
    if exists (
      select 1 from public.bookings
      where car_id = new.car_id
        and id != new.id
        and status = 'confirmed'
        and start_date < new.end_date
        and end_date > new.start_date
    ) then
      raise exception 'BOOKING_OVERLAP: car % is already confirmed for those dates', new.car_id;
    end if;

    -- Check against car_unavailable blocks
    if exists (
      select 1 from public.car_unavailable
      where car_id = new.car_id
        and start_date < new.end_date
        and end_date > new.start_date
    ) then
      raise exception 'CAR_UNAVAILABLE: car % is blocked for those dates', new.car_id;
    end if;
  end if;

  return new;
end;
$$;

create or replace trigger trg_check_booking_overlap
  before insert or update on public.bookings
  for each row execute function public.check_booking_overlap();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.users enable row level security;
alter table public.cars enable row level security;
alter table public.car_unavailable enable row level security;
alter table public.bookings enable row level security;
alter table public.maintenance enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.damage_reports enable row level security;

-- Helper: check if current user has a given role
create or replace function public.current_user_role()
returns text language sql security definer stable as $$
  select coalesce(
    (select role from public.users where id = auth.uid()),
    'anon'
  );
$$;

-- Grant execute to authenticated users
grant execute on function public.current_user_role() to authenticated;

-- ── USERS ──────────────────────────────────────────────────────────────────
drop policy if exists "users_select" on public.users;
create policy "users_select" on public.users for select using (
  id = auth.uid()
  or public.current_user_role() in ('admin', 'staff')
);

drop policy if exists "users_insert" on public.users;
create policy "users_insert" on public.users for insert with check (
  id = auth.uid()
  or public.current_user_role() = 'admin'
);

drop policy if exists "users_update" on public.users;
create policy "users_update" on public.users for update using (
  id = auth.uid()
  or public.current_user_role() = 'admin'
);

drop policy if exists "users_delete" on public.users;
create policy "users_delete" on public.users for delete using (
  public.current_user_role() = 'admin'
);

-- ── CARS ──────────────────────────────────────────────────────────────────
drop policy if exists "cars_public_read" on public.cars;
create policy "cars_public_read" on public.cars for select using (true);

drop policy if exists "cars_admin_staff_write" on public.cars;
create policy "cars_admin_staff_write" on public.cars for insert with check (
  public.current_user_role() in ('admin', 'staff')
);

drop policy if exists "cars_admin_staff_update" on public.cars;
create policy "cars_admin_staff_update" on public.cars for update using (
  public.current_user_role() in ('admin', 'staff')
);

drop policy if exists "cars_admin_delete" on public.cars;
create policy "cars_admin_delete" on public.cars for delete using (
  public.current_user_role() = 'admin'
);

-- ── CAR_UNAVAILABLE ───────────────────────────────────────────────────────
drop policy if exists "car_unavail_public_read" on public.car_unavailable;
create policy "car_unavail_public_read" on public.car_unavailable for select using (true);

drop policy if exists "car_unavail_admin_staff_write" on public.car_unavailable;
create policy "car_unavail_admin_staff_write" on public.car_unavailable for all using (
  public.current_user_role() in ('admin', 'staff')
);

-- ── BOOKINGS ──────────────────────────────────────────────────────────────
drop policy if exists "bookings_select" on public.bookings;
create policy "bookings_select" on public.bookings for select using (
  user_id = auth.uid()
  or public.current_user_role() in ('admin', 'staff')
);

drop policy if exists "bookings_insert" on public.bookings;
create policy "bookings_insert" on public.bookings for insert with check (
  user_id = auth.uid()
  or public.current_user_role() in ('admin', 'staff')
);

drop policy if exists "bookings_update" on public.bookings;
create policy "bookings_update" on public.bookings for update using (
  user_id = auth.uid()
  or public.current_user_role() in ('admin', 'staff')
);

drop policy if exists "bookings_delete" on public.bookings;
create policy "bookings_delete" on public.bookings for delete using (
  public.current_user_role() = 'admin'
);

-- ── MAINTENANCE ───────────────────────────────────────────────────────────
drop policy if exists "maintenance_admin_staff" on public.maintenance;
create policy "maintenance_admin_staff" on public.maintenance for all using (
  public.current_user_role() in ('admin', 'staff')
);

-- ── PAYMENTS ──────────────────────────────────────────────────────────────
drop policy if exists "payments_select" on public.payments;
create policy "payments_select" on public.payments for select using (
  user_id = auth.uid()
  or public.current_user_role() in ('admin', 'staff')
);

drop policy if exists "payments_insert" on public.payments;
create policy "payments_insert" on public.payments for insert with check (
  user_id = auth.uid()
  or public.current_user_role() in ('admin', 'staff')
);

drop policy if exists "payments_update" on public.payments;
create policy "payments_update" on public.payments for update using (
  public.current_user_role() in ('admin', 'staff')
);

-- ── REVIEWS ───────────────────────────────────────────────────────────────
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews for select using (true);

drop policy if exists "reviews_customer_insert" on public.reviews;
create policy "reviews_customer_insert" on public.reviews for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.bookings
    where id = booking_id
      and user_id = auth.uid()
      and status = 'completed'
  )
);

drop policy if exists "reviews_owner_delete" on public.reviews;
create policy "reviews_owner_delete" on public.reviews for delete using (
  user_id = auth.uid()
  or public.current_user_role() = 'admin'
);

-- ── NOTIFICATIONS ─────────────────────────────────────────────────────────
drop policy if exists "notifications_own" on public.notifications;
create policy "notifications_own" on public.notifications for all using (
  user_id = auth.uid()
  or public.current_user_role() in ('admin', 'staff')
);

drop policy if exists "notifications_admin_insert" on public.notifications;
create policy "notifications_admin_insert" on public.notifications for insert with check (
  public.current_user_role() in ('admin', 'staff')
  or user_id = auth.uid()
);

-- ── DAMAGE REPORTS ────────────────────────────────────────────────────────
drop policy if exists "damage_reports_select" on public.damage_reports;
create policy "damage_reports_select" on public.damage_reports for select using (
  reported_by = auth.uid()
  or public.current_user_role() in ('admin', 'staff')
);

drop policy if exists "damage_reports_insert" on public.damage_reports;
create policy "damage_reports_insert" on public.damage_reports for insert with check (
  reported_by = auth.uid()
  or public.current_user_role() in ('admin', 'staff')
);

drop policy if exists "damage_reports_update" on public.damage_reports;
create policy "damage_reports_update" on public.damage_reports for update using (
  public.current_user_role() in ('admin', 'staff')
);

-- ============================================================================
-- ANALYTICS VIEWS (read-only)
-- ============================================================================
create or replace view public.booking_analytics as
select
  date_trunc('month', created_at) as month,
  count(*) filter (where status = 'confirmed' or status = 'completed') as confirmed,
  count(*) filter (where status = 'cancelled') as cancelled,
  count(*) filter (where status = 'completed') as completed,
  sum(total_amount) filter (where status in ('confirmed', 'completed')) as revenue
from public.bookings
group by 1
order by 1 desc;

create or replace view public.car_utilization as
select
  c.car_id,
  c.make,
  c.model,
  c.location,
  count(b.id) filter (where b.status in ('confirmed', 'completed')) as total_bookings,
  coalesce(sum(b.end_date - b.start_date) filter (where b.status in ('confirmed', 'completed')), 0) as total_days_booked,
  coalesce(sum(b.total_amount) filter (where b.status in ('confirmed', 'completed')), 0) as total_revenue,
  c.rating,
  c.review_count
from public.cars c
left join public.bookings b on b.car_id = c.car_id
group by c.car_id, c.make, c.model, c.location, c.rating, c.review_count;

-- ============================================================================
-- SAMPLE DATA (optional — comment out if you have real data)
-- ============================================================================
-- Uncomment to seed test cars:
/*
insert into public.cars (make, model, year, price_per_day, seats, transmission, fuel_type, location, features, description, category, status) values
  ('Toyota', 'Camry', 2023, 75, 5, 'automatic', 'petrol', 'New York', array['Bluetooth', 'Backup Camera', 'Cruise Control'], 'Comfortable and reliable sedan perfect for city driving.', 'sedan', 'active'),
  ('BMW', 'X5', 2023, 150, 7, 'automatic', 'petrol', 'Los Angeles', array['Leather Seats', 'Panoramic Roof', 'Navigation', 'Heated Seats'], 'Premium luxury SUV with all the features you need.', 'suv', 'active'),
  ('Tesla', 'Model 3', 2023, 120, 5, 'automatic', 'electric', 'San Francisco', array['Autopilot', 'Long Range', 'Premium Sound', 'Glass Roof'], 'Electric sedan with cutting-edge technology.', 'sedan', 'active'),
  ('Honda', 'Civic', 2022, 60, 5, 'manual', 'petrol', 'Chicago', array['Bluetooth', 'Fuel Efficient', 'Backup Camera'], 'Fuel-efficient compact car, ideal for daily commutes.', 'hatchback', 'active'),
  ('Mercedes-Benz', 'E-Class', 2023, 180, 5, 'automatic', 'petrol', 'Miami', array['Leather Seats', 'Heated Seats', 'Navigation', 'Driver Assistance'], 'Iconic luxury sedan with superior comfort and style.', 'luxury', 'active'),
  ('Ford', 'Mustang', 2022, 110, 4, 'automatic', 'petrol', 'Dallas', array['Sport Mode', 'Performance Pack', 'Bluetooth', 'Backup Camera'], 'Classic American muscle car for thrill-seekers.', 'sports', 'active')
on conflict do nothing;
*/

-- ============================================================================
-- DONE
-- ============================================================================
-- After running this file:
-- 1. Set up Supabase Auth (Email/Password enabled)
-- 2. Register your first user — they auto-become admin
-- 3. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
-- 4. Optionally set SUPABASE_SERVICE_ROLE_KEY for overlap checks (recommended)
-- ============================================================================
