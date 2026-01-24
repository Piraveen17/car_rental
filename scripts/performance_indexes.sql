-- Improvements for GET /api/cars performance
-- Used for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_cars_status ON public.cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_created_at ON public.cars(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cars_price_per_day ON public.cars(price_per_day);

-- Improvements for bookings and availability check
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_car_id_status ON public.bookings(car_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(start_date, end_date);

-- Analyze tables to update statistics for query planner
ANALYZE public.cars;
ANALYZE public.bookings;
