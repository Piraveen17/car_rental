# Car Rental System - Test Suite

## Setup

```bash
# Install jest + ts-jest for TypeScript tests
npm install --save-dev jest @types/jest ts-jest date-fns

# Add to package.json:
# "scripts": { "test": "jest" }
# "jest": { "preset": "ts-jest", "testEnvironment": "node" }
```

Or with Vitest (recommended for Next.js):

```bash
npm install --save-dev vitest @vitest/ui
# Change first line of test file from "describe/test" imports if needed
npx vitest
```

## Running

```bash
npm test                     # Run all tests
npm test -- --watch          # Watch mode
npm test -- --coverage       # Coverage report
npx vitest ui                # Interactive UI
```

## Test Coverage

| Category | Tests | What's Covered |
|----------|-------|----------------|
| Date Overlap | 7 | Overlap detection, blocked set, edge cases |
| Booking Validation | 5 | Min/max days, past dates, total calculation |
| Addon Costs | 9 | Every addon type + combinations |
| Status Transitions | 7 | Valid/invalid booking status changes |
| Car Status | 4 | Maintenance sync logic |
| Manual Booking | 4 | Overlap check, email/phone validation |
| Notifications | 3 | Message generation per type |
| Analytics | 3 | Revenue, occupancy calculations |

## Key Business Rules Tested

1. **No Date Overlap**: A confirmed booking blocks those dates.
   Adjacent bookings (A ends Mar 10, B starts Mar 10) are ALLOWED.

2. **Booking Status Machine**: pending → confirmed/rejected/cancelled.
   Completed/cancelled/rejected bookings cannot be reverted.

3. **Maintenance Auto-Sync**: Creating a maintenance record sets car to "maintenance".
   When ALL maintenance records are "fixed", car returns to "active".

4. **Addon Pricing**:
   - Driver, child seat, GPS, insurance → per day
   - Delivery → flat fee (one-time)
   - Extra KM → per km (one-time)
