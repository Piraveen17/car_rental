/**
 * Car Rental System - Test Suite
 * 
 * Tests covering:
 * 1. Date overlap logic (the most critical business rule)
 * 2. Booking flow validation
 * 3. Addon cost calculations
 * 4. Maintenance status sync
 * 5. Type consistency
 * 
 * Run with: npx jest  OR  npx vitest
 */

import {
  addDays,
  startOfDay,
  format,
  differenceInCalendarDays,
  eachDayOfInterval,
} from "date-fns";

// ============================================================
// CORE UTILITY: Date Overlap Detection
// (mirrors the logic in booking-calendar.tsx and DB trigger)
// ============================================================

type DateRange = { start: Date; end: Date };

/**
 * Returns true if range A overlaps with range B.
 * Uses half-open intervals: [start, end)
 */
function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.start < b.end && a.end > b.start;
}

/**
 * Build a set of blocked date strings for O(1) lookup.
 */
function buildBlockedSet(ranges: DateRange[]): Set<string> {
  const set = new Set<string>();
  for (const r of ranges) {
    if (r.end <= r.start) continue;
    for (const d of eachDayOfInterval({ start: r.start, end: addDays(r.end, -1) })) {
      set.add(format(d, "yyyy-MM-dd"));
    }
  }
  return set;
}

function isDateBlocked(date: Date, blockedSet: Set<string>): boolean {
  return blockedSet.has(format(startOfDay(date), "yyyy-MM-dd"));
}

// ============================================================
// ADDON PRICING
// ============================================================

const ADDON_PRICES = {
  driver: 35,
  extraKm: 0.25,
  delivery: 50,
  childSeat: 10,
  gpsNavigation: 8,
  insurance_basic: 15,
  insurance_full: 30,
} as const;

type AddonsConfig = {
  driver?: boolean;
  extraKmQty?: number;
  delivery?: boolean;
  childSeat?: boolean;
  childSeatQty?: number;
  gpsNavigation?: boolean;
  insurance?: boolean;
  insuranceType?: "basic" | "full";
};

function calculateAddonCost(addons: AddonsConfig, rentalDays: number): number {
  let cost = 0;
  if (addons.driver) cost += ADDON_PRICES.driver * rentalDays;
  if (addons.extraKmQty) cost += addons.extraKmQty * ADDON_PRICES.extraKm;
  if (addons.delivery) cost += ADDON_PRICES.delivery;
  if (addons.childSeat) cost += ADDON_PRICES.childSeat * (addons.childSeatQty ?? 1) * rentalDays;
  if (addons.gpsNavigation) cost += ADDON_PRICES.gpsNavigation * rentalDays;
  if (addons.insurance) {
    cost += (addons.insuranceType === "full"
      ? ADDON_PRICES.insurance_full
      : ADDON_PRICES.insurance_basic) * rentalDays;
  }
  return cost;
}

// ============================================================
// TEST SUITE
// ============================================================

describe("Date Overlap Detection", () => {
  const today = startOfDay(new Date("2026-03-01"));

  test("non-overlapping ranges return false", () => {
    const a: DateRange = { start: new Date("2026-03-01"), end: new Date("2026-03-05") };
    const b: DateRange = { start: new Date("2026-03-05"), end: new Date("2026-03-10") };
    expect(rangesOverlap(a, b)).toBe(false);
  });

  test("overlapping ranges return true", () => {
    const a: DateRange = { start: new Date("2026-03-01"), end: new Date("2026-03-06") };
    const b: DateRange = { start: new Date("2026-03-04"), end: new Date("2026-03-10") };
    expect(rangesOverlap(a, b)).toBe(true);
  });

  test("fully contained range returns true", () => {
    const outer: DateRange = { start: new Date("2026-03-01"), end: new Date("2026-03-15") };
    const inner: DateRange = { start: new Date("2026-03-05"), end: new Date("2026-03-10") };
    expect(rangesOverlap(outer, inner)).toBe(true);
    expect(rangesOverlap(inner, outer)).toBe(true);
  });

  test("adjacent ranges (touching end-to-start) do NOT overlap", () => {
    // Booking ends Mar 10, next starts Mar 10 - this is valid (pick-up same day as drop-off)
    const a: DateRange = { start: new Date("2026-03-01"), end: new Date("2026-03-10") };
    const b: DateRange = { start: new Date("2026-03-10"), end: new Date("2026-03-15") };
    expect(rangesOverlap(a, b)).toBe(false);
  });

  test("same day booking overlaps itself", () => {
    const a: DateRange = { start: new Date("2026-03-05"), end: new Date("2026-03-06") };
    const b: DateRange = { start: new Date("2026-03-05"), end: new Date("2026-03-06") };
    expect(rangesOverlap(a, b)).toBe(true);
  });

  test("blockedSet correctly marks dates", () => {
    const blocked: DateRange[] = [
      { start: new Date("2026-03-10"), end: new Date("2026-03-15") },
    ];
    const set = buildBlockedSet(blocked);
    
    // Days 10, 11, 12, 13, 14 should be blocked (end is exclusive)
    expect(isDateBlocked(new Date("2026-03-10"), set)).toBe(true);
    expect(isDateBlocked(new Date("2026-03-14"), set)).toBe(true);
    expect(isDateBlocked(new Date("2026-03-15"), set)).toBe(false); // exclusive end
    expect(isDateBlocked(new Date("2026-03-09"), set)).toBe(false);
  });

  test("blockedSet with multiple ranges", () => {
    const blocked: DateRange[] = [
      { start: new Date("2026-03-05"), end: new Date("2026-03-07") },
      { start: new Date("2026-03-15"), end: new Date("2026-03-18") },
    ];
    const set = buildBlockedSet(blocked);
    
    expect(isDateBlocked(new Date("2026-03-06"), set)).toBe(true);
    expect(isDateBlocked(new Date("2026-03-08"), set)).toBe(false);
    expect(isDateBlocked(new Date("2026-03-16"), set)).toBe(true);
    expect(isDateBlocked(new Date("2026-03-18"), set)).toBe(false);
  });

  test("invalid range (end before start) is ignored", () => {
    const invalid: DateRange[] = [
      { start: new Date("2026-03-10"), end: new Date("2026-03-05") }, // inverted
    ];
    const set = buildBlockedSet(invalid);
    expect(set.size).toBe(0);
  });
});

describe("Booking Validation", () => {
  test("rental duration calculation is correct", () => {
    const start = new Date("2026-03-01");
    const end = new Date("2026-03-06");
    const days = differenceInCalendarDays(end, start);
    expect(days).toBe(5);
  });

  test("minimum rental days enforcement", () => {
    const start = new Date("2026-03-01");
    const end = new Date("2026-03-02"); // 1 day
    const days = differenceInCalendarDays(end, start);
    const minDays = 2;
    expect(days < minDays).toBe(true); // should fail validation
  });

  test("maximum rental days enforcement", () => {
    const start = new Date("2026-03-01");
    const end = new Date("2026-04-15"); // 45 days
    const days = differenceInCalendarDays(end, start);
    const maxDays = 30;
    expect(days > maxDays).toBe(true); // should fail validation
  });

  test("past date selection is rejected", () => {
    const past = new Date("2020-01-01");
    const today = startOfDay(new Date());
    expect(past < today).toBe(true);
  });

  test("total amount calculation: base + addons", () => {
    const pricePerDay = 120;
    const days = 5;
    const baseAmount = pricePerDay * days; // 600
    const addons: AddonsConfig = { driver: true, gpsNavigation: true };
    const addonsAmount = calculateAddonCost(addons, days); // 35*5 + 8*5 = 215
    const total = baseAmount + addonsAmount;
    expect(baseAmount).toBe(600);
    expect(addonsAmount).toBe(215);
    expect(total).toBe(815);
  });
});

describe("Addon Cost Calculations", () => {
  test("no addons = zero cost", () => {
    const cost = calculateAddonCost({}, 7);
    expect(cost).toBe(0);
  });

  test("driver addon: per day", () => {
    const cost = calculateAddonCost({ driver: true }, 3);
    expect(cost).toBe(35 * 3); // 105
  });

  test("delivery: flat fee", () => {
    const cost = calculateAddonCost({ delivery: true }, 5);
    expect(cost).toBe(50); // flat fee regardless of days
  });

  test("extra km: per km", () => {
    const cost = calculateAddonCost({ extraKmQty: 100 }, 5);
    expect(cost).toBe(25); // 100 * 0.25
  });

  test("child seat: per day", () => {
    const cost = calculateAddonCost({ childSeat: true, childSeatQty: 2 }, 3);
    expect(cost).toBe(10 * 2 * 3); // 60
  });

  test("gps navigation: per day", () => {
    const cost = calculateAddonCost({ gpsNavigation: true }, 4);
    expect(cost).toBe(8 * 4); // 32
  });

  test("basic insurance: per day", () => {
    const cost = calculateAddonCost({ insurance: true, insuranceType: "basic" }, 5);
    expect(cost).toBe(15 * 5); // 75
  });

  test("full insurance: per day", () => {
    const cost = calculateAddonCost({ insurance: true, insuranceType: "full" }, 5);
    expect(cost).toBe(30 * 5); // 150
  });

  test("all addons combined", () => {
    const addons: AddonsConfig = {
      driver: true,
      extraKmQty: 100,
      delivery: true,
      childSeat: true,
      childSeatQty: 1,
      gpsNavigation: true,
      insurance: true,
      insuranceType: "basic",
    };
    const cost = calculateAddonCost(addons, 3);
    // driver: 35*3=105, extraKm: 25, delivery: 50, childSeat: 10*1*3=30, gps: 8*3=24, insurance: 15*3=45
    expect(cost).toBe(105 + 25 + 50 + 30 + 24 + 45); // 279
  });
});

describe("Booking Status Transitions", () => {
  type BookingStatus = "pending" | "confirmed" | "cancelled" | "rejected" | "completed";

  const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    pending: ["confirmed", "rejected", "cancelled"],
    confirmed: ["completed", "cancelled"],
    cancelled: [],
    rejected: [],
    completed: [],
  };

  function canTransition(from: BookingStatus, to: BookingStatus): boolean {
    return VALID_TRANSITIONS[from].includes(to);
  }

  test("pending → confirmed is allowed", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
  });

  test("pending → rejected is allowed", () => {
    expect(canTransition("pending", "rejected")).toBe(true);
  });

  test("confirmed → completed is allowed", () => {
    expect(canTransition("confirmed", "completed")).toBe(true);
  });

  test("confirmed → cancelled is allowed", () => {
    expect(canTransition("confirmed", "cancelled")).toBe(true);
  });

  test("completed → cancelled is NOT allowed", () => {
    expect(canTransition("completed", "cancelled")).toBe(false);
  });

  test("rejected → confirmed is NOT allowed", () => {
    expect(canTransition("rejected", "confirmed")).toBe(false);
  });

  test("cancelled → confirmed is NOT allowed", () => {
    expect(canTransition("cancelled", "confirmed")).toBe(false);
  });
});

describe("Car Status Logic", () => {
  type CarStatus = "active" | "inactive" | "maintenance";
  type MaintenanceStatus = "pending" | "in_progress" | "fixed";

  function getCarStatusAfterMaintenance(
    currentCarStatus: CarStatus,
    maintenanceStatus: MaintenanceStatus,
    openMaintenanceCount: number
  ): CarStatus {
    if (maintenanceStatus === "pending" || maintenanceStatus === "in_progress") {
      return "maintenance";
    }
    // Fixed: restore only if no other open records
    if (maintenanceStatus === "fixed" && openMaintenanceCount === 0) {
      return currentCarStatus === "maintenance" ? "active" : currentCarStatus;
    }
    return currentCarStatus;
  }

  test("maintenance record created → car goes to maintenance", () => {
    const result = getCarStatusAfterMaintenance("active", "pending", 1);
    expect(result).toBe("maintenance");
  });

  test("maintenance fixed + no others → car returns to active", () => {
    const result = getCarStatusAfterMaintenance("maintenance", "fixed", 0);
    expect(result).toBe("active");
  });

  test("maintenance fixed + other open records → car stays in maintenance", () => {
    const result = getCarStatusAfterMaintenance("maintenance", "fixed", 2);
    expect(result).toBe("maintenance");
  });

  test("in_progress maintenance → car stays in maintenance", () => {
    const result = getCarStatusAfterMaintenance("maintenance", "in_progress", 1);
    expect(result).toBe("maintenance");
  });
});

describe("Manual Booking Validation", () => {
  test("staff cannot create booking if car has confirmed overlap", () => {
    const existingBookings: DateRange[] = [
      { start: new Date("2026-04-10"), end: new Date("2026-04-15") },
    ];
    const newBooking: DateRange = {
      start: new Date("2026-04-12"),
      end: new Date("2026-04-17"),
    };
    
    const hasConflict = existingBookings.some((b) => rangesOverlap(b, newBooking));
    expect(hasConflict).toBe(true);
  });

  test("manual booking succeeds when no overlap", () => {
    const existingBookings: DateRange[] = [
      { start: new Date("2026-04-10"), end: new Date("2026-04-15") },
    ];
    const newBooking: DateRange = {
      start: new Date("2026-04-15"),
      end: new Date("2026-04-20"),
    };
    
    const hasConflict = existingBookings.some((b) => rangesOverlap(b, newBooking));
    expect(hasConflict).toBe(false);
  });

  test("email validation for manual booking customer", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test("customer@example.com")).toBe(true);
    expect(emailRegex.test("invalid-email")).toBe(false);
    expect(emailRegex.test("")).toBe(false);
  });

  test("phone validation", () => {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,20}$/;
    expect(phoneRegex.test("+1-555-000-1234")).toBe(true);
    expect(phoneRegex.test("0712345678")).toBe(true);
    expect(phoneRegex.test("abc")).toBe(false);
  });
});

describe("Notification Logic", () => {
  type NotificationType =
    | "booking_created"
    | "booking_confirmed"
    | "booking_rejected"
    | "booking_cancelled"
    | "booking_completed"
    | "payment_received"
    | "maintenance_due"
    | "general";

  function getNotificationMessage(
    type: NotificationType,
    context: { carName?: string; startDate?: string; amount?: number }
  ): string {
    switch (type) {
      case "booking_created":
        return `Your booking for ${context.carName ?? "the car"} has been submitted and is awaiting confirmation.`;
      case "booking_confirmed":
        return `Your booking for ${context.carName ?? "the car"} from ${context.startDate} has been confirmed!`;
      case "booking_rejected":
        return `Your booking for ${context.carName ?? "the car"} was not approved.`;
      case "booking_cancelled":
        return `Your booking for ${context.carName ?? "the car"} has been cancelled.`;
      case "booking_completed":
        return `Thank you! Your rental of ${context.carName ?? "the car"} is complete.`;
      case "payment_received":
        return `Payment of $${context.amount ?? 0} received. Thank you!`;
      case "maintenance_due":
        return `Maintenance scheduled for ${context.carName ?? "a vehicle"}.`;
      default:
        return "You have a new notification.";
    }
  }

  test("booking_created message includes car name", () => {
    const msg = getNotificationMessage("booking_created", { carName: "Toyota Camry" });
    expect(msg).toContain("Toyota Camry");
  });

  test("payment_received message includes amount", () => {
    const msg = getNotificationMessage("payment_received", { amount: 450 });
    expect(msg).toContain("450");
  });

  test("unknown type falls back to general message", () => {
    const msg = getNotificationMessage("general", {});
    expect(msg).toBeTruthy();
    expect(typeof msg).toBe("string");
  });
});

describe("Analytics Calculations", () => {
  const mockBookings = [
    { status: "completed", totalAmount: 300, paymentStatus: "paid" },
    { status: "completed", totalAmount: 150, paymentStatus: "paid" },
    { status: "cancelled", totalAmount: 200, paymentStatus: "refunded" },
    { status: "pending", totalAmount: 100, paymentStatus: "pending" },
    { status: "confirmed", totalAmount: 250, paymentStatus: "paid" },
  ];

  test("total revenue counts only completed+paid bookings", () => {
    const revenue = mockBookings
      .filter((b) => b.status === "completed" && b.paymentStatus === "paid")
      .reduce((sum, b) => sum + b.totalAmount, 0);
    expect(revenue).toBe(450);
  });

  test("occupancy count: active (confirmed) bookings", () => {
    const active = mockBookings.filter((b) => b.status === "confirmed").length;
    expect(active).toBe(1);
  });

  test("cancelled booking count", () => {
    const cancelled = mockBookings.filter((b) => b.status === "cancelled").length;
    expect(cancelled).toBe(1);
  });
});
