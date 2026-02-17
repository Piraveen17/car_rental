-- Feature 1: Availability
-- Add min/max days to cars
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS min_days int DEFAULT 1;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS max_days int DEFAULT 30;

-- Blocked dates table (maintenance or other reasons)
CREATE TABLE IF NOT EXISTS public.car_unavailable (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id uuid REFERENCES public.cars(car_id) ON DELETE CASCADE,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text DEFAULT 'maintenance',
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_car_unavailable_car_id ON public.car_unavailable(car_id);

-- Feature 2: Booking Add-ons
-- Master addons table
CREATE TABLE IF NOT EXISTS public.addons (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    pricing_type text NOT NULL CHECK (pricing_type IN ('per_day', 'per_unit', 'fixed')),
    price numeric(10,2) NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true
);

-- Seed addons
INSERT INTO public.addons (code, name, pricing_type, price) VALUES
('driver', 'Chauffeur Service', 'per_day', 50.00),
('extra_km', 'Extra KM Bundle (100km)', 'per_unit', 20.00),
('delivery', 'Delivery & Pickup', 'fixed', 30.00)
ON CONFLICT (code) DO NOTHING;

-- Booking addons snapshot
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

-- Update bookings table with financial fields
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS base_amount numeric(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS addons_amount numeric(10,2) DEFAULT 0;
-- total_amount already exists, verify type
-- payment_status already exists, verify default

-- Feature 3: Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
    invoice_no text UNIQUE NOT NULL,
    pdf_url text NOT NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices(booking_id);

-- Feature 4: Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id uuid REFERENCES public.cars(car_id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
    rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment text,
    is_approved boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(car_id, user_id, booking_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_car_id ON public.reviews(car_id);

-- RLS Policies
-- Enable RLS
ALTER TABLE public.car_unavailable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- car_unavailable policies
CREATE POLICY "Public read unavailable" ON public.car_unavailable FOR SELECT USING (true);
CREATE POLICY "Staff manage unavailable" ON public.car_unavailable FOR ALL USING (
    public.is_role(array['admin', 'staff'])
);

-- addons policies
CREATE POLICY "Public read addons" ON public.addons FOR SELECT USING (true);
CREATE POLICY "Staff manage addons" ON public.addons FOR ALL USING (
    public.is_role(array['admin', 'staff'])
);

-- booking_addons policies
CREATE POLICY "Users read own booking addons" ON public.booking_addons FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_addons.booking_id AND user_id = auth.uid())
);
CREATE POLICY "Staff read all booking addons" ON public.booking_addons FOR SELECT USING (
    public.is_role(array['admin', 'staff'])
);
CREATE POLICY "Users insert booking addons" ON public.booking_addons FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_addons.booking_id AND user_id = auth.uid())
);

-- invoices policies
CREATE POLICY "Users read own invoices" ON public.invoices FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bookings WHERE id = invoices.booking_id AND user_id = auth.uid())
);
CREATE POLICY "Staff read all invoices" ON public.invoices FOR SELECT USING (
    public.is_role(array['admin', 'staff'])
);
-- Invoice insertion usually done by system/admin functions, but let's allow staff explicitly if needed
CREATE POLICY "Staff insert invoices" ON public.invoices FOR INSERT WITH CHECK (
    public.is_role(array['admin', 'staff'])
);

-- reviews policies
CREATE POLICY "Public read approved reviews" ON public.reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Users create reviews" ON public.reviews FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE id = booking_id 
        AND user_id = auth.uid() 
        AND status = 'completed'
    )
);
CREATE POLICY "Staff manage reviews" ON public.reviews FOR ALL USING (
    public.is_role(array['admin', 'staff'])
);
