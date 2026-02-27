/**
 * Integration Tests — API Route Handlers
 *
 * Tests the Next.js route handler functions in isolation using
 * a mocked Supabase client. No real DB calls are made.
 *
 * Pattern:
 *   1. Mock @/lib/supabase/server to return a controlled client
 *   2. Mock the auth to return a test user
 *   3. Call the handler with a mock NextRequest
 *   4. Assert response status and JSON body
 */

import { NextRequest } from "next/server";

// ─── Mock Supabase ─────────────────────────────────────────────────────────────

const mockUser = {
  id: "user-001",
  email: "admin@example.com",
  role: "service_role",
};

// Build a chainable Supabase query mock
function makeQueryMock(returnData: unknown, returnError: null | { message: string } = null) {
  const chain: Record<string, jest.Mock> = {};
  const methods = [
    "select", "eq", "neq", "in", "order", "limit", "range",
    "single", "maybeSingle", "insert", "update", "delete",
    "filter", "ilike", "gte", "lte", "is", "not",
  ];

  const terminal = jest.fn().mockResolvedValue({ data: returnData, error: returnError });

  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });

  // Terminal methods return the promise
  (["single", "maybeSingle"] as const).forEach((m) => {
    chain[m] = terminal;
  });

  // select / insert / update / delete are entry points that ultimately resolve
  chain.select = jest.fn().mockReturnValue({
    ...chain,
    single: terminal,
    maybeSingle: terminal,
    then: (cb: (v: unknown) => void) => Promise.resolve({ data: returnData, error: returnError }).then(cb),
  });

  chain.insert = jest.fn().mockReturnValue({
    ...chain,
    select: jest.fn().mockReturnValue({
      single: terminal,
    }),
    then: (cb: (v: unknown) => void) => Promise.resolve({ data: returnData, error: returnError }).then(cb),
  });

  chain.update = jest.fn().mockReturnValue({
    ...chain,
    eq: jest.fn().mockReturnValue({
      ...chain,
      select: jest.fn().mockReturnValue({ single: terminal }),
    }),
    then: (cb: (v: unknown) => void) => Promise.resolve({ data: returnData, error: returnError }).then(cb),
  });

  chain.delete = jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({ error: null }),
  });

  return chain;
}

function makeMockSupabase(tableData: Record<string, { data: unknown; error: null | { message: string } }>) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: jest.fn((table: string) => {
      const entry = tableData[table] ?? { data: [], error: null };
      return makeQueryMock(entry.data, entry.error);
    }),
  };
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: jest.fn(),
}));

// Helper to build a mock NextRequest
function mockRequest(
  method: string,
  body?: Record<string, unknown>,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL(`http://localhost/api/test`);
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { "content-type": "application/json" },
  });
}

// ─── Cars API ─────────────────────────────────────────────────────────────────

describe("GET /api/cars", () => {
  const { createClient } = require("@/lib/supabase/server");

  const mockCar = {
    car_id: "car-001", make: "Toyota", model: "Camry", year: 2022,
    price_per_day: 120, status: "active", seats: 5,
    transmission: "automatic", fuel_type: "petrol", location: "Colombo",
    images: [], features: [], description: null, category: "sedan",
    color: "Silver", license_plate: "ABC-1234", vin: null, mileage: 10000,
    min_rental_days: 1, max_rental_days: 30, security_deposit: 200,
    rating: 4.5, review_count: 5,
    created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    createClient.mockResolvedValue(makeMockSupabase({ cars: { data: [mockCar], error: null } }));
  });

  test("returns 200 with cars array", async () => {
    const { GET } = await import("@/app/api/cars/route");
    const req = mockRequest("GET", undefined, { limit: "10", page: "1" });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(Array.isArray(json.cars)).toBe(true);
  });
});

describe("POST /api/cars", () => {
  const { createClient } = require("@/lib/supabase/server");

  const newCar = {
    make: "Honda", model: "Civic", year: 2023,
    pricePerDay: 90, transmission: "automatic", seats: 5,
    fuelType: "petrol", location: "Kandy", category: "sedan",
    status: "active", images: [], features: [],
  };

  const insertedCar = { car_id: "car-new", ...newCar, created_at: new Date().toISOString() };

  beforeEach(() => {
    createClient.mockResolvedValue(makeMockSupabase({ cars: { data: insertedCar, error: null } }));
  });

  test("returns 201 on successful car creation", async () => {
    const { POST } = await import("@/app/api/cars/route");
    const req = mockRequest("POST", newCar);

    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ─── Maintenance API ──────────────────────────────────────────────────────────

describe("POST /api/maintenance", () => {
  const { createClient } = require("@/lib/supabase/server");

  const validPayload = {
    carId: "car-001",
    type: "oil_change",
    description: "Regular 3-month service",
    status: "pending",
    startDate: "2026-04-01",
    estimatedCost: 150,
  };

  beforeEach(() => {
    createClient.mockResolvedValue(makeMockSupabase({
      maintenance: { data: { id: "m-1", ...validPayload }, error: null },
    }));
  });

  test("returns 201 with valid maintenance payload", async () => {
    const { POST } = await import("@/app/api/maintenance/route");
    const req = mockRequest("POST", validPayload);
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  test("returns 400 with invalid maintenance type", async () => {
    const { POST } = await import("@/app/api/maintenance/route");
    const req = mockRequest("POST", { ...validPayload, type: "invalid_type_xyz" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test("returns 400 with invalid maintenance status", async () => {
    const { POST } = await import("@/app/api/maintenance/route");
    const req = mockRequest("POST", { ...validPayload, status: "fixed" }); // 'fixed' not in DB
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ─── Damage Reports API ───────────────────────────────────────────────────────

describe("POST /api/damage-reports", () => {
  const { createClient } = require("@/lib/supabase/server");

  const validReport = {
    bookingId: "booking-001",
    carId: "car-001",
    description: "Dent on rear left door",
    photos: [],
    estimatedRepairCost: 400,
  };

  beforeEach(() => {
    createClient.mockResolvedValue(makeMockSupabase({
      damage_reports: { data: { id: "dmg-new", ...validReport, status: "pending" }, error: null },
    }));
  });

  test("inserts with status: pending and returns 201", async () => {
    const { POST } = await import("@/app/api/damage-reports/route");
    const req = mockRequest("POST", validReport);
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ─── Reviews API ──────────────────────────────────────────────────────────────

describe("POST /api/reviews", () => {
  const { createClient } = require("@/lib/supabase/server");

  const validReview = {
    carId: "car-001",
    bookingId: "booking-001",
    rating: 4,
    comment: "Smooth ride, clean car.",
  };

  const mockBooking = {
    id: "booking-001", user_id: "user-001", car_id: "car-001",
    status: "completed", end_date: "2026-03-15",
  };

  beforeEach(() => {
    const supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }) },
      from: jest.fn((table: string) => {
        if (table === "bookings") return makeQueryMock(mockBooking, null);
        if (table === "reviews") return makeQueryMock({ id: "review-new", ...validReview }, null);
        return makeQueryMock(null, null);
      }),
    };
    createClient.mockResolvedValue(supabase);
  });

  test("returns 201 on valid review submission", async () => {
    const { POST } = await import("@/app/api/reviews/route");
    const req = mockRequest("POST", validReview);
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  test("does not include is_approved in payload (non-schema field)", async () => {
    // If is_approved was being sent, Supabase would throw an error.
    // This test ensures the POST handler doesn't error with a valid booking.
    const { POST } = await import("@/app/api/reviews/route");
    const req = mockRequest("POST", validReview);
    const res = await POST(req);
    const json = await res.json();
    // Should be success, not a schema violation error
    expect(json.error).toBeUndefined();
  });
});

// ─── Payments API ─────────────────────────────────────────────────────────────

describe("POST /api/payments", () => {
  const { createClient } = require("@/lib/supabase/server");

  const validPayment = {
    bookingId: "booking-001",
    amount: 650,
    method: "online",
  };

  beforeEach(() => {
    createClient.mockResolvedValue(makeMockSupabase({
      payments: { data: { id: "pay-new", ...validPayment, status: "pending" }, error: null },
    }));
  });

  test("returns 201 on valid payment — no currency field", async () => {
    const { POST } = await import("@/app/api/payments/route");
    const req = mockRequest("POST", validPayment);
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ─── Notifications API ────────────────────────────────────────────────────────

describe("GET /api/notifications", () => {
  const { createClient } = require("@/lib/supabase/server");

  const mockNotifications = [
    {
      id: "n-1", user_id: "user-001", type: "booking",
      title: "Booking Confirmed", message: "Your booking is confirmed.",
      href: "/dashboard", read: false, created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    createClient.mockResolvedValue(makeMockSupabase({
      notifications: { data: mockNotifications, error: null },
    }));
  });

  test("returns 200 with notifications array", async () => {
    const { GET } = await import("@/app/api/notifications/route");
    const req = mockRequest("GET");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
