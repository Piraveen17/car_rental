# Test Folder (Production Release QA)
Generated: 2026-02-16 UTC

This folder contains manual QA test cases for the Car Rental + Selling Management System (Next.js + Supabase).

## How to use
- Execute tests in order: Auth/RBAC → Booking flow → Overlap/Maintenance → Payments/Invoices → Notifications → Exports → Security/Abuse.
- Record results in `EXECUTION_LOG.md` (pass/fail, notes, screenshots).
- For API tests, use Postman/Insomnia or `curl` with a valid session cookie/JWT.

## Environments
- **Local**: `npm run dev`
- **Staging/Prod**: deployed URL + Supabase project
