/**
 * Unit Tests — lib/mappers.ts
 *
 * Tests every exported mapper function against realistic Supabase row shapes.
 * No network calls — pure data transformation tests.
 */

import {
  carFromDb,
  bookingFromDb,
  maintenanceFromDb,
  reviewFromDb,
  notificationFromDb,
  userFromDb,
} from "@/lib/mappers";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DB_CAR = {
  car_id: "car-001",
  make: "Toyota",
  model: "Camry",
  year: 2022,
  price_per_day: 120,
  status: "active",
  seats: 5,
  transmission: "automatic",
  fuel_type: "petrol",
  location: "Colombo",
  images: ["https://example.com/img.jpg"],
  features: ["Bluetooth", "GPS"],
  description: "Great sedan",
  category: "sedan",
  color: "Silver",
  license_plate: "ABC-1234",
  vin: null,
  mileage: 15000,
  min_rental_days: 1,
  max_rental_days: 30,
  security_deposit: 200,
  rating: 4.5,
  review_count: 10,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-06-01T00:00:00Z",
};

const DB_BOOKING = {
  id: "booking-001",
  user_id: "user-001",
  car_id: "car-001",
  start_date: "2026-03-10",
  end_date: "2026-03-15",
  status: "confirmed",
  payment_status: "paid",
  base_amount: 600,
  addons_amount: 50,
  total_amount: 650,
  deposit_amount: 200,
  deposit_returned: false,
  addons: null,
  notes: "Arrive at 9am",
  admin_note: null,
  cancel_reason: null,
  cancelled_by: null,
  booking_source: "online",
  created_at: "2026-02-01T10:00:00Z",
  updated_at: "2026-02-01T10:00:00Z",
  cars: { car_id: "car-001", make: "Toyota", model: "Camry" },
  users: { id: "user-001", name: "Jane Doe", email: "jane@example.com" },
};

const DB_MAINTENANCE = {
  id: "maint-001",
  car_id: "car-001",
  type: "oil_change",
  description: "Regular service",
  status: "pending",
  start_date: "2026-03-01",
  end_date: "2026-03-02",
  estimated_cost: 150,
  actual_cost: null,
  completed_date: null,
  mileage_at_service: 15000,
  service_provider: "Quick Lube",
  created_at: "2026-02-20T08:00:00Z",
  updated_at: "2026-02-20T08:00:00Z",
  cars: { car_id: "car-001", make: "Toyota", model: "Camry" },
};

const DB_REVIEW = {
  id: "review-001",
  car_id: "car-001",
  user_id: "user-001",
  booking_id: "booking-001",
  rating: 4,
  comment: "Great drive!",
  is_verified: true,
  created_at: "2026-03-20T12:00:00Z",
  users: { id: "user-001", name: "Jane Doe" },
  cars: { car_id: "car-001", make: "Toyota", model: "Camry" },
};

const DB_NOTIFICATION = {
  id: "notif-001",
  user_id: "user-001",
  type: "booking",
  title: "Booking Confirmed",
  message: "Your booking has been confirmed.",
  href: "/dashboard",
  read: false,
  created_at: "2026-03-01T09:00:00Z",
};

const DB_USER = {
  id: "user-001",
  email: "jane@example.com",
  name: "Jane Doe",
  phone: "+94771234567",
  nic_passport: "P1234567",
  role: "customer",
  avatar_url: null,
  address: "123 Main St",
  city: "Colombo",
  country: "Sri Lanka",
  date_of_birth: "1995-06-15",
  license_number: "LK-1234",
  license_expiry: "2028-06-15",
  emergency_contact: "+94779876543",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// ─── carFromDb ────────────────────────────────────────────────────────────────

describe("carFromDb", () => {
  const car = carFromDb(DB_CAR);

  test("maps carId from car_id", () => {
    expect(car.carId).toBe("car-001");
  });

  test("maps pricePerDay from price_per_day", () => {
    expect(car.pricePerDay).toBe(120);
  });

  test("maps fuelType from fuel_type", () => {
    expect(car.fuelType).toBe("petrol");
  });

  test("maps minRentalDays and maxRentalDays", () => {
    expect(car.minRentalDays).toBe(1);
    expect(car.maxRentalDays).toBe(30);
  });

  test("createdAt is a Date object", () => {
    expect(car.createdAt).toBeInstanceOf(Date);
  });

  test("images array is preserved", () => {
    expect(Array.isArray(car.images)).toBe(true);
    expect(car.images[0]).toContain("example.com");
  });

  test("throws on null input", () => {
    expect(() => carFromDb(null)).toThrow();
  });
});

// ─── bookingFromDb ────────────────────────────────────────────────────────────

describe("bookingFromDb", () => {
  const booking = bookingFromDb(DB_BOOKING);

  test("maps bookingId from id", () => {
    expect(booking.bookingId).toBe("booking-001");
  });

  test("maps bookingStatus from status", () => {
    expect(booking.bookingStatus).toBe("confirmed");
  });

  test("maps totalAmount from total_amount", () => {
    expect(booking.totalAmount).toBe(650);
  });

  test("startDate and endDate are Date objects", () => {
    expect(booking.startDate).toBeInstanceOf(Date);
    expect(booking.endDate).toBeInstanceOf(Date);
  });

  test("nested car object is mapped when cars is present", () => {
    expect(booking.car?.make).toBe("Toyota");
  });

  test("paymentStatus is mapped", () => {
    expect(booking.paymentStatus).toBe("paid");
  });

  test("throws on null input", () => {
    expect(() => bookingFromDb(null)).toThrow();
  });
});

// ─── maintenanceFromDb ────────────────────────────────────────────────────────

describe("maintenanceFromDb", () => {
  const m = maintenanceFromDb(DB_MAINTENANCE);

  test("maps recordId from id", () => {
    expect(m.recordId).toBe("maint-001");
  });

  test("maps startDate from start_date (not 'date')", () => {
    expect(m.startDate).toBeInstanceOf(Date);
  });

  test("'date' field does not exist — it's startDate", () => {
    expect((m as any).date).toBeUndefined();
  });

  test("maps estimatedCost from estimated_cost (not 'cost')", () => {
    expect(m.estimatedCost).toBe(150);
    expect((m as any).cost).toBeUndefined();
  });

  test("actualCost is undefined when DB value is null", () => {
    expect(m.actualCost).toBeUndefined();
  });

  test("endDate is a Date object", () => {
    expect(m.endDate).toBeInstanceOf(Date);
  });

  test("status is mapped", () => {
    expect(m.status).toBe("pending");
  });

  test("nested car is mapped", () => {
    expect(m.car?.make).toBe("Toyota");
  });

  test("throws on null input", () => {
    expect(() => maintenanceFromDb(null)).toThrow();
  });
});

// ─── reviewFromDb ─────────────────────────────────────────────────────────────

describe("reviewFromDb", () => {
  const r = reviewFromDb(DB_REVIEW);

  test("maps reviewId from id", () => {
    expect(r.reviewId).toBe("review-001");
  });

  test("rating is numeric", () => {
    expect(r.rating).toBe(4);
  });

  test("comment is mapped", () => {
    expect(r.comment).toBe("Great drive!");
  });

  test("no sub-rating fields (non-schema)", () => {
    expect((r as any).cleanliness).toBeUndefined();
    expect((r as any).comfort).toBeUndefined();
    expect((r as any).valueForMoney).toBeUndefined();
    expect((r as any).ownerReply).toBeUndefined();
    expect((r as any).ownerRepliedAt).toBeUndefined();
  });

  test("createdAt is Date", () => {
    expect(r.createdAt).toBeInstanceOf(Date);
  });

  test("throws on null input", () => {
    expect(() => reviewFromDb(null)).toThrow();
  });
});

// ─── notificationFromDb ───────────────────────────────────────────────────────

describe("notificationFromDb", () => {
  const n = notificationFromDb(DB_NOTIFICATION);

  test("maps id field directly", () => {
    // INotification uses 'id' (not 'notificationId')
    expect(n.id).toBe("notif-001");
  });

  test("maps message (not body)", () => {
    expect(n.message).toBe("Your booking has been confirmed.");
    expect((n as any).body).toBeUndefined();
  });

  test("maps read boolean (not is_read)", () => {
    expect(n.read).toBe(false);
    expect((n as any).is_read).toBeUndefined();
    expect((n as any).isRead).toBeUndefined();
  });

  test("title is required and mapped", () => {
    expect(n.title).toBe("Booking Confirmed");
  });

  test("no metadata or updatedAt in output", () => {
    expect((n as any).metadata).toBeUndefined();
    expect((n as any).updatedAt).toBeUndefined();
  });

  test("throws on null input", () => {
    expect(() => notificationFromDb(null)).toThrow();
  });
});

// ─── userFromDb ───────────────────────────────────────────────────────────────

describe("userFromDb", () => {
  const u = userFromDb(DB_USER);

  test("maps userId from id", () => {
    expect(u.userId).toBe("user-001");
  });

  test("maps nicPassport from nic_passport", () => {
    expect(u.nicPassport).toBe("P1234567");
  });

  test("role is correct", () => {
    expect(u.role).toBe("customer");
  });

  test("isActive is boolean", () => {
    expect(u.isActive).toBe(true);
  });

  test("createdAt is Date", () => {
    expect(u.createdAt).toBeInstanceOf(Date);
  });

  test("no clerkUserId (legacy field removed)", () => {
    expect((u as any).clerkUserId).toBeUndefined();
  });

  test("throws on null input", () => {
    expect(() => userFromDb(null)).toThrow();
  });
});
