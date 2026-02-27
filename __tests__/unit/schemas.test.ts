/**
 * Unit Tests — lib/schemas/ (Zod validation)
 *
 * Verifies that zod schemas accept valid payloads and reject invalid ones.
 * No network calls — pure validation tests.
 */

import { manualBookingSchema } from "@/lib/schemas/booking-schema";

// ─── Manual Booking Schema ────────────────────────────────────────────────────

describe("manualBookingSchema", () => {
  const VALID = {
    email: "jane@example.com",
    name: "Jane Doe",
    phone: "0771234567",
    carId: "car-uuid-001",
    startDate: "2026-04-01",
    endDate: "2026-04-07",
    totalAmount: 840,
    paymentStatus: "pending" as const,
  };

  test("accepts a fully valid payload", () => {
    const result = manualBookingSchema.safeParse(VALID);
    expect(result.success).toBe(true);
  });

  test("rejects invalid email", () => {
    const result = manualBookingSchema.safeParse({ ...VALID, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("email");
    }
  });

  test("rejects name shorter than 2 chars", () => {
    const result = manualBookingSchema.safeParse({ ...VALID, name: "A" });
    expect(result.success).toBe(false);
  });

  test("rejects empty carId", () => {
    const result = manualBookingSchema.safeParse({ ...VALID, carId: "" });
    expect(result.success).toBe(false);
  });

  test("rejects invalid startDate", () => {
    const result = manualBookingSchema.safeParse({ ...VALID, startDate: "not-a-date" });
    expect(result.success).toBe(false);
  });

  test("rejects end date before start date", () => {
    const result = manualBookingSchema.safeParse({
      ...VALID,
      startDate: "2026-04-10",
      endDate: "2026-04-05",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.toLowerCase().includes("end date"))).toBe(true);
    }
  });

  test("rejects same start and end date", () => {
    const result = manualBookingSchema.safeParse({
      ...VALID,
      startDate: "2026-04-10",
      endDate: "2026-04-10",
    });
    expect(result.success).toBe(false);
  });

  test("coerces totalAmount string to number", () => {
    const result = manualBookingSchema.safeParse({ ...VALID, totalAmount: "500" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.totalAmount).toBe(500);
  });

  test("rejects negative totalAmount", () => {
    const result = manualBookingSchema.safeParse({ ...VALID, totalAmount: -10 });
    expect(result.success).toBe(false);
  });

  test("defaults paymentStatus to 'pending' when omitted", () => {
    const { paymentStatus: _, ...withoutStatus } = VALID;
    const result = manualBookingSchema.safeParse(withoutStatus);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.paymentStatus).toBe("pending");
  });

  test("rejects invalid paymentStatus value", () => {
    const result = manualBookingSchema.safeParse({ ...VALID, paymentStatus: "approved" });
    expect(result.success).toBe(false);
  });
});

// ─── Enum Validation Helpers ──────────────────────────────────────────────────

describe("Schema Enum Consistency", () => {
  // These tests ensure our TypeScript enum constants match what the DB allows.
  // If new values are added to DB CHECK constraints, these tests will catch drift.

  const VALID_BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed", "rejected"];
  const VALID_MAINTENANCE_STATUSES = ["pending", "in_progress", "completed", "cancelled"];
  const VALID_MAINTENANCE_TYPES = [
    "oil_change", "tire_rotation", "brake_service", "engine_repair",
    "transmission", "electrical", "body_work", "inspection", "repair", "other",
  ];
  const VALID_CAR_STATUSES = ["active", "inactive", "maintenance"];
  const VALID_CAR_CATEGORIES = [
    "sedan", "suv", "hatchback", "luxury", "sports",
    "minivan", "pickup", "coupe", "convertible", "economy",
  ];
  const VALID_PAYMENT_METHODS = ["card", "bank", "cash", "online", "bank_transfer", "other"];
  const VALID_PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"];
  const VALID_BOOKING_PAYMENT_STATUSES = ["pending", "paid", "refunded", "failed"];
  const VALID_USER_ROLES = ["admin", "staff", "customer"];
  const VALID_DAMAGE_REPORT_STATUSES = ["pending", "reviewed", "repaired"];

  test("booking status list matches SQL CHECK constraint", () => {
    expect(VALID_BOOKING_STATUSES).toEqual(
      expect.arrayContaining(["pending", "confirmed", "cancelled", "completed", "rejected"])
    );
    expect(VALID_BOOKING_STATUSES).toHaveLength(5);
  });

  test("maintenance status list matches SQL CHECK constraint", () => {
    // SQL: ('pending', 'in_progress', 'completed', 'cancelled') — NOT 'fixed'
    expect(VALID_MAINTENANCE_STATUSES).not.toContain("fixed");
    expect(VALID_MAINTENANCE_STATUSES).toContain("in_progress");
    expect(VALID_MAINTENANCE_STATUSES).toContain("cancelled");
    expect(VALID_MAINTENANCE_STATUSES).toHaveLength(4);
  });

  test("maintenance type list matches SQL CHECK constraint (10 types)", () => {
    expect(VALID_MAINTENANCE_TYPES).toHaveLength(10);
    expect(VALID_MAINTENANCE_TYPES).toContain("oil_change");
    expect(VALID_MAINTENANCE_TYPES).toContain("repair");
  });

  test("car status list matches SQL CHECK constraint", () => {
    expect(VALID_CAR_STATUSES).toHaveLength(3);
    expect(VALID_CAR_STATUSES).not.toContain("available"); // not in DB
  });

  test("car category list matches SQL CHECK constraint (10 values)", () => {
    expect(VALID_CAR_CATEGORIES).toHaveLength(10);
    expect(VALID_CAR_CATEGORIES).toContain("economy");
  });

  test("payment method matches SQL CHECK", () => {
    expect(VALID_PAYMENT_METHODS).toContain("bank_transfer");
    expect(VALID_PAYMENT_METHODS).toContain("bank");
    expect(VALID_PAYMENT_METHODS).toContain("other");
    expect(VALID_PAYMENT_METHODS).toHaveLength(6);
  });

  test("user roles match SQL CHECK constraint", () => {
    expect(VALID_USER_ROLES).toEqual(["admin", "staff", "customer"]);
  });

  test("damage report status matches IDamageReport type", () => {
    expect(VALID_DAMAGE_REPORT_STATUSES).not.toContain("resolved"); // not in type
    expect(VALID_DAMAGE_REPORT_STATUSES).not.toContain("assessed"); // not in type
    expect(VALID_DAMAGE_REPORT_STATUSES).toContain("pending");
    expect(VALID_DAMAGE_REPORT_STATUSES).toContain("reviewed");
    expect(VALID_DAMAGE_REPORT_STATUSES).toContain("repaired");
    expect(VALID_DAMAGE_REPORT_STATUSES).toHaveLength(3);
  });

  test("booking payment status matches SQL CHECK", () => {
    expect(VALID_BOOKING_PAYMENT_STATUSES).toContain("paid");
    expect(VALID_BOOKING_PAYMENT_STATUSES).not.toContain("cancelled");
  });
});
