# Car Rental System - Production Setup Guide

## Quick Start

### 1. Environment Variables
Copy `.env.example` to `.env.local` and fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Supabase Setup
1. Create a new Supabase project at supabase.com
2. Go to SQL Editor → paste contents of `scripts/supabase_production.sql`
3. Run the SQL (creates all tables, RLS policies, triggers)

### 3. Install & Run
```bash
npm install
npm run dev       # Development
npm run build     # Production build
npm start         # Production server
```

### 4. Run Tests
```bash
npm test                   # All tests
npm test -- --coverage     # With coverage
npm test -- --watch        # Watch mode
```

---

## Architecture

### Database Tables
| Table | Purpose |
|-------|---------|
| `users` | Customer/staff/admin profiles |
| `cars` | Vehicle fleet |
| `car_unavailable` | Admin-blocked date ranges |
| `bookings` | All rental bookings |
| `maintenance` | Vehicle service records |
| `payments` | Payment transactions |
| `reviews` | Customer reviews (1-5 stars) |
| `notifications` | In-app notifications |
| `damage_reports` | Post-rental damage claims |

### Key Business Rules
1. **Date Overlap**: Only CONFIRMED bookings block dates. Pending = awaiting staff approval.
2. **Double-booking**: Prevented at 3 levels: UI calendar, API check, DB trigger.
3. **Booking Flow**: Customer books (pending) → Staff confirms → Auto-completes on end_date
4. **Maintenance Sync**: Creating maintenance record → car status = "maintenance". All fixed → "active"
5. **Reviews**: Only customers with COMPLETED bookings can review. One review per booking.

### User Roles
- **Admin**: Full access, can change user roles, manage all data
- **Staff**: Can manage bookings, maintenance; cannot change roles or delete
- **Customer**: Can browse cars, book, view own bookings, submit reviews

---

## Owner Perspective - What's New

### For Car Rental Owners (Admin)
- Block specific dates per car (maintenance, private events)
- View damage reports filed by customers  
- Respond to customer reviews (owner reply)
- Analytics dashboard: revenue, occupancy rate, top cars
- Manual booking creation (walk-in customers)
- Export bookings/cars/maintenance to CSV/Excel

### For Customers
- View real-time availability (blocked dates shown in calendar)
- Book with add-ons: Driver, Delivery, Child Seat, GPS, Insurance
- Cancel pending bookings
- Report damage after rental
- Leave verified reviews with sub-ratings (cleanliness, comfort, value)
- Download invoice PDF
- Dashboard with all booking history

---

## Missing Fields Added

### Cars
- `category` (economy/compact/sedan/suv/luxury/sports/van/truck)
- `color`
- `license_plate` (unique)
- `vin` (unique)
- `mileage`
- `min_rental_days` / `max_rental_days`
- `security_deposit`
- `rating` (auto-calculated from reviews)
- `review_count` (auto-calculated)

### Bookings
- `deposit_amount` / `deposit_returned`
- `booking_source` (online/manual)
- `notes`
- `pickup_location` / `dropoff_location`
- `actual_return_date`
- `late_fee_amount`
- `damage_reported`
- `child_seat` addon
- `gps_navigation` addon
- `insurance` addon (basic/full)
- `insurance_type`

### Maintenance
- `type` (oil_change/tire_rotation/brake_service/etc.)
- `estimated_cost`
- `completed_date`
- `mileage_at_service`
- `service_provider`
- `status`: added `in_progress` state

### Users
- `address`, `city`, `country`
- `date_of_birth`
- `license_number`, `license_expiry`
- `emergency_contact`
- `avatar_url`
- `is_active`

---

## Testing

All 42 tests in `__tests__/booking-overlap.test.ts` cover:
- Date overlap detection (7 cases)
- Booking validation (5 cases)
- Addon cost calculation (9 cases)
- Booking status state machine (7 cases)
- Car/maintenance status sync (4 cases)
- Manual booking validation (4 cases)
- Notification messages (3 cases)
- Analytics calculations (3 cases)

---

## Deployment Checklist

- [ ] Supabase SQL run (scripts/supabase_production.sql)
- [ ] Environment variables set
- [ ] Supabase realtime enabled for `notifications` and `bookings` tables
- [ ] Storage bucket created for car images
- [ ] First user registered (automatically becomes admin)
- [ ] Admin adds cars to fleet
- [ ] `npm run build` passes with no errors
- [ ] Tests pass: `npm test`
