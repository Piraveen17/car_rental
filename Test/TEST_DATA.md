# Test Data Setup (Suggested)

Create these users (or equivalent):
- Admin: admin@example.com / password
- Staff: staff@example.com / password
- Customer A: custA@example.com / password
- Customer B: custB@example.com / password

Create cars:
- Car 1: available, price_per_day set, min_days=1, max_days=30
- Car 2: available, price_per_day set
- Car 3: available

Maintenance block:
- Add `car_unavailable` for Car 1: start_date=tomorrow, end_date=tomorrow+2 days (date range)

Bookings for overlap tests:
- Confirmed booking on Car 2: start=tomorrow 09:00, end=tomorrow+2 days 09:00

Notes:
- CONFIRMED overlaps must be rejected.
- PENDING should not block, but CONFIRMED + maintenance must block.
