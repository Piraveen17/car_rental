-- ------------------------------------------------------------
-- 0) Enable UUID Extension
-- ------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- 1) Helper: updated_at trigger function
-- ------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- 2) USERS TABLE (Profile + Role)
-- ------------------------------------------------------------
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  role text default 'customer' check (role in ('admin', 'staff', 'customer')),
  phone text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

drop trigger if exists on_users_updated on public.users;
create trigger on_users_updated
  before update on public.users
  for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------
-- 2.1) Role check helper for RLS
-- ------------------------------------------------------------
create or replace function public.is_role(roles text[])
returns boolean
language plpgsql security definer stable
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = any(roles)
  );
end;
$$;

-- ------------------------------------------------------------
-- 2.2) Auto-create public.users row when auth.users is created
--      First user becomes ADMIN, others CUSTOMER
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  is_first boolean;
begin
  select not exists (select 1 from public.users) into is_first;

  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    case when is_first then 'admin' else 'customer' end
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- 3) CARS TABLE (Rental Fleet)
-- ------------------------------------------------------------
create table if not exists public.cars (
  car_id uuid default uuid_generate_v4() primary key,
  make text not null,
  model text not null,
  year integer not null,
  transmission text,
  fuel_type text,
  location text,
  seats integer,
  price_per_day numeric not null,
  status text default 'active' check (status in ('active', 'inactive', 'maintenance')),
  images text[],
  features text[],
  description text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

drop trigger if exists on_cars_updated on public.cars;
create trigger on_cars_updated
  before update on public.cars
  for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------
-- 4) SALE CARS TABLE (Cars for Sale)
-- ------------------------------------------------------------
create table if not exists public.sale_cars (
  id uuid default uuid_generate_v4() primary key,
  make text not null,
  model text not null,
  year integer not null,
  price numeric not null,
  mileage integer,
  color text,
  description text,
  images text[],
  status text default 'available' check (status in ('available', 'sold', 'reserved')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

drop trigger if exists on_sale_cars_updated on public.sale_cars;
create trigger on_sale_cars_updated
  before update on public.sale_cars
  for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------
-- 5) BOOKINGS TABLE
-- ------------------------------------------------------------
create table if not exists public.bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  car_id uuid references public.cars(car_id) not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  total_amount numeric not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  booking_source text default 'online' check (booking_source in ('online', 'manual')),
  created_by_role text check (created_by_role is null or created_by_role in ('admin','staff','customer')),
  created_by_user_id uuid,
  cancelled_by text check (cancelled_by is null or cancelled_by in ('admin','staff','customer')),
  cancel_reason text,
  cancelled_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

drop trigger if exists on_bookings_updated on public.bookings;
create trigger on_bookings_updated
  before update on public.bookings
  for each row execute procedure public.handle_updated_at();

create index if not exists idx_bookings_user_id on public.bookings(user_id);
create index if not exists idx_bookings_car_id on public.bookings(car_id);
create index if not exists idx_bookings_status on public.bookings(status);

-- ------------------------------------------------------------
-- 6) LEADS TABLE
-- ------------------------------------------------------------
create table if not exists public.leads (
  id uuid default uuid_generate_v4() primary key,
  sale_car_id uuid references public.sale_cars(id),
  name text not null,
  email text not null,
  phone text,
  message text,
  status text default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

drop trigger if exists on_leads_updated on public.leads;
create trigger on_leads_updated
  before update on public.leads
  for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------
-- 7) MAINTENANCE TABLE
-- ------------------------------------------------------------
create table if not exists public.maintenance (
  id uuid default uuid_generate_v4() primary key,
  car_id uuid references public.cars(car_id) not null,
  type text,
  description text,
  date timestamptz not null,
  cost numeric,
  status text default 'pending' check (status in ('pending', 'fixed')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

drop trigger if exists on_maintenance_updated on public.maintenance;
create trigger on_maintenance_updated
  before update on public.maintenance
  for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------
-- 8) NOTIFICATIONS TABLE
-- ------------------------------------------------------------
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  message text not null,
  type text,
  read boolean default false,
  metadata jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

drop trigger if exists on_notifications_updated on public.notifications;
create trigger on_notifications_updated
  before update on public.notifications
  for each row execute procedure public.handle_updated_at();

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(read);

-- ------------------------------------------------------------
-- 9) PAYMENTS TABLE
-- ------------------------------------------------------------
create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  booking_id uuid references public.bookings(id),
  amount numeric not null,
  currency text default 'USD',
  status text default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  method text,
  transaction_id text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

drop trigger if exists on_payments_updated on public.payments;
create trigger on_payments_updated
  before update on public.payments
  for each row execute procedure public.handle_updated_at();

create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_booking_id on public.payments(booking_id);

-- ------------------------------------------------------------
-- 10) ENABLE RLS
-- ------------------------------------------------------------
alter table public.users enable row level security;
alter table public.cars enable row level security;
alter table public.sale_cars enable row level security;
alter table public.bookings enable row level security;
alter table public.leads enable row level security;
alter table public.maintenance enable row level security;
alter table public.notifications enable row level security;
alter table public.payments enable row level security;

-- ------------------------------------------------------------
-- 11) RLS POLICIES
-- ------------------------------------------------------------
-- USERS
create policy "users_read_own_profile"
on public.users for select
using (auth.uid() = id);

create policy "admins_staff_read_all_profiles"
on public.users for select
using (public.is_role(array['admin','staff']));

create policy "users_update_own_profile"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "admin_can_change_roles"
on public.users for update
using (public.is_role(array['admin']))
with check (public.is_role(array['admin']));

-- CARS
create policy "public_read_available_cars"
on public.cars for select
using (status in ('active' , 'inactive' , 'maintenance'));

create policy "admin_read_all_cars"
on public.cars for select
using (public.is_role(array['admin']));

create policy "admin_insert_cars"
on public.cars for insert
with check (public.is_role(array['admin']));

create policy "admin_update_cars"
on public.cars for update
using (public.is_role(array['admin']))
with check (public.is_role(array['admin']));

create policy "admin_delete_cars"
on public.cars for delete
using (public.is_role(array['admin']));

-- SALE CARS
create policy "public_read_sale_cars"
on public.sale_cars for select
using (true);

create policy "admin_staff_insert_sale_cars"
on public.sale_cars for insert
with check (public.is_role(array['admin','staff']));

create policy "admin_staff_update_sale_cars"
on public.sale_cars for update
using (public.is_role(array['admin','staff']))
with check (public.is_role(array['admin','staff']));

create policy "admin_staff_delete_sale_cars"
on public.sale_cars for delete
using (public.is_role(array['admin','staff']));

-- BOOKINGS
create policy "customer_read_own_bookings"
on public.bookings for select
using (auth.uid() = user_id);

create policy "admin_staff_read_all_bookings"
on public.bookings for select
using (public.is_role(array['admin','staff']));

create policy "customer_create_own_bookings"
on public.bookings for insert
with check (auth.uid() = user_id);

create policy "admin_staff_update_bookings"
on public.bookings for update
using (public.is_role(array['admin','staff']))
with check (public.is_role(array['admin','staff']));

create policy "admin_delete_bookings"
on public.bookings for delete
using (public.is_role(array['admin']));

-- LEADS
create policy "admin_staff_read_leads"
on public.leads for select
using (public.is_role(array['admin','staff']));

create policy "public_insert_leads"
on public.leads for insert
with check (true);

create policy "admin_staff_update_leads"
on public.leads for update
using (public.is_role(array['admin','staff']))
with check (public.is_role(array['admin','staff']));

-- MAINTENANCE
create policy "admin_staff_manage_maintenance"
on public.maintenance for all
using (public.is_role(array['admin','staff']))
with check (public.is_role(array['admin','staff']));

-- NOTIFICATIONS
create policy "user_read_own_notifications"
on public.notifications for select
using (auth.uid() = user_id);

create policy "user_mark_own_notifications_read"
on public.notifications for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "admin_staff_insert_notifications"
on public.notifications for insert
with check (public.is_role(array['admin','staff']));

-- PAYMENTS
create policy "user_read_own_payments"
on public.payments for select
using (auth.uid() = user_id);

create policy "admin_staff_read_all_payments"
on public.payments for select
using (public.is_role(array['admin','staff']));

create policy "user_insert_own_payments"
on public.payments for insert
with check (auth.uid() = user_id);

create policy "admin_staff_update_payments"
on public.payments for update
using (public.is_role(array['admin','staff']))
with check (public.is_role(array['admin','staff']));
