import type { IBooking, ICar, IMaintenance, IUser, IReview, INotification } from "@/types";

function pickDefined(obj: Record<string, any>) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

// ============================================================
// CAR MAPPERS
// ============================================================

export function carFromDb(c: any): ICar {
  if (!c) throw new Error("carFromDb: received null/undefined");
  return {
    carId: c.carId ?? c.car_id ?? c.id,
    make: c.make ?? "",
    model: c.model ?? "",
    year: Number(c.year ?? new Date().getFullYear()),
    pricePerDay: Number(c.pricePerDay ?? c.price_per_day ?? 0),
    transmission: (c.transmission ?? "automatic") as any,
    fuelType: c.fuelType ?? c.fuel_type ?? "",
    seats: Number(c.seats ?? 4),
    status: (c.status ?? "active") as any,
    images: Array.isArray(c.images) ? c.images : [],
    features: Array.isArray(c.features) ? c.features : [],
    location: c.location ?? "",
    description: c.description ?? "",
    category: c.category ?? undefined,
    color: c.color ?? undefined,
    licensePlate: c.licensePlate ?? c.license_plate ?? undefined,
    vin: c.vin ?? undefined,
    mileage: c.mileage ? Number(c.mileage) : undefined,
    minRentalDays: c.minRentalDays ?? c.min_rental_days ?? 1,
    maxRentalDays: c.maxRentalDays ?? c.max_rental_days ?? 30,
    securityDeposit: c.securityDeposit ?? c.security_deposit
      ? Number(c.securityDeposit ?? c.security_deposit)
      : 0,
    rating: c.rating ? Number(c.rating) : 0,
    reviewCount: c.reviewCount ?? c.review_count ? Number(c.reviewCount ?? c.review_count) : 0,
    createdAt: c.createdAt
      ? new Date(c.createdAt)
      : c.created_at
      ? new Date(c.created_at)
      : new Date(),
    updatedAt: c.updatedAt
      ? new Date(c.updatedAt)
      : c.updated_at
      ? new Date(c.updated_at)
      : new Date(),
  } as ICar;
}

export function carToDbInsert(payload: any) {
  return pickDefined({
    make: payload.make,
    model: payload.model,
    year: payload.year,
    price_per_day: payload.pricePerDay ?? payload.price_per_day,
    transmission: payload.transmission,
    fuel_type: payload.fuelType ?? payload.fuel_type,
    seats: payload.seats,
    status: payload.status,
    images: payload.images ?? [],
    features: payload.features ?? [],
    location: payload.location,
    description: payload.description,
    category: payload.category,
    color: payload.color,
    license_plate: payload.licensePlate ?? payload.license_plate,
    vin: payload.vin,
    mileage: payload.mileage,
    min_rental_days: payload.minRentalDays ?? payload.min_rental_days,
    max_rental_days: payload.maxRentalDays ?? payload.max_rental_days,
    security_deposit: payload.securityDeposit ?? payload.security_deposit,
  });
}

export function carToDbUpdate(payload: any) {
  const raw = carToDbInsert(payload);
  delete (raw as any).car_id;
  return raw;
}

// ============================================================
// BOOKING MAPPERS
// ============================================================

export function bookingFromDb(b: any): IBooking {
  if (!b) throw new Error("bookingFromDb: received null/undefined");
  const startRaw = b.startDate ?? b.start_date;
  const endRaw = b.endDate ?? b.end_date;

  // Normalize addons - DB stores as JSONB
  const addons = b.addons ?? {};
  
  return {
    bookingId: b.bookingId ?? b.id,
    carId: b.carId ?? b.car_id,
    userId: b.userId ?? b.user_id,
    totalAmount: Number(b.totalAmount ?? b.total_amount ?? 0),
    baseAmount: b.baseAmount ?? b.base_amount
      ? Number(b.baseAmount ?? b.base_amount)
      : undefined,
    addonsAmount: b.addonsAmount ?? b.addons_amount
      ? Number(b.addonsAmount ?? b.addons_amount)
      : undefined,
    depositAmount: b.depositAmount ?? b.deposit_amount
      ? Number(b.depositAmount ?? b.deposit_amount)
      : 0,
    depositReturned: b.depositReturned ?? b.deposit_returned ?? false,
    paymentStatus: (b.paymentStatus ?? b.payment_status ?? "pending") as any,
    paymentMethod: b.paymentMethod ?? b.payment_method ?? undefined,
    paidAt: (b.paidAt ?? b.paid_at) ? new Date(b.paidAt ?? b.paid_at) : undefined,
    bookingStatus: (b.bookingStatus ?? b.status ?? "pending") as any,
    bookingSource: (b.bookingSource ?? b.booking_source ?? "online") as any,
    addons: {
      driver: addons.driver ?? false,
      driverQty: addons.driverQty ?? addons.driver_qty,
      extraKmQty: addons.extraKmQty ?? addons.extra_km_qty ?? 0,
      delivery: addons.delivery ?? false,
      deliveryAddress: addons.deliveryAddress ?? addons.delivery_address,
      childSeat: addons.childSeat ?? addons.child_seat ?? false,
      childSeatQty: addons.childSeatQty ?? addons.child_seat_qty ?? 0,
      gpsNavigation: addons.gpsNavigation ?? addons.gps_navigation ?? false,
      insurance: addons.insurance ?? false,
      insuranceType: addons.insuranceType ?? addons.insurance_type,
    },
    startDate: startRaw ? new Date(startRaw) : new Date(),
    endDate: endRaw ? new Date(endRaw) : new Date(),
    invoiceUrl: b.invoiceUrl ?? b.invoice_url ?? undefined,
    notes: b.notes ?? undefined,
    pickupLocation: b.pickupLocation ?? b.pickup_location ?? undefined,
    dropoffLocation: b.dropoffLocation ?? b.dropoff_location ?? undefined,
    cancelReason: b.cancelReason ?? b.cancel_reason ?? undefined,
    cancelledBy: (b.cancelledBy ?? b.cancelled_by ?? undefined) as any,
    cancelledAt: (b.cancelledAt ?? b.cancelled_at)
      ? new Date(b.cancelledAt ?? b.cancelled_at)
      : undefined,
    actualReturnDate: (b.actualReturnDate ?? b.actual_return_date)
      ? new Date(b.actualReturnDate ?? b.actual_return_date)
      : undefined,
    lateFeeAmount: b.lateFeeAmount ?? b.late_fee_amount
      ? Number(b.lateFeeAmount ?? b.late_fee_amount)
      : 0,
    damageReported: b.damageReported ?? b.damage_reported ?? false,
    car: (b.cars || b.car) ? carFromDb(b.cars || b.car) : undefined,
    user: (b.users || b.user) ? userFromDb(b.users || b.user) : undefined,
    createdAt: (b.createdAt ?? b.created_at)
      ? new Date(b.createdAt ?? b.created_at)
      : new Date(),
    updatedAt: (b.updatedAt ?? b.updated_at)
      ? new Date(b.updatedAt ?? b.updated_at)
      : new Date(),
  } as IBooking;
}

// ============================================================
// USER MAPPER
// ============================================================

export function userFromDb(u: any): IUser {
  if (!u) throw new Error("userFromDb: received null/undefined");
  return {
    userId: u.userId ?? u.id,
    name: u.name ?? "",
    email: u.email ?? "",
    phone: u.phone ?? undefined,
    nicPassport: u.nicPassport ?? u.nic_passport ?? undefined,
    role: (u.role ?? "customer") as any,
    isActive: u.isActive ?? u.is_active ?? true,
    address: u.address ?? undefined,
    city: u.city ?? undefined,
    country: u.country ?? undefined,
    dateOfBirth: u.dateOfBirth ?? u.date_of_birth ?? undefined,
    licenseNumber: u.licenseNumber ?? u.license_number ?? undefined,
    licenseExpiry: u.licenseExpiry ?? u.license_expiry ?? undefined,
    emergencyContact: u.emergencyContact ?? u.emergency_contact ?? undefined,
    avatarUrl: u.avatarUrl ?? u.avatar_url ?? undefined,
    createdAt: (u.createdAt ?? u.created_at)
      ? new Date(u.createdAt ?? u.created_at)
      : new Date(),
    updatedAt: (u.updatedAt ?? u.updated_at)
      ? new Date(u.updatedAt ?? u.updated_at)
      : new Date(),
  };
}

// ============================================================
// MAINTENANCE MAPPER
// ============================================================

export function maintenanceFromDb(m: any): IMaintenance {
  if (!m) throw new Error("maintenanceFromDb: received null/undefined");
  return {
    recordId: m.recordId ?? m.id,
    carId: m.carId ?? m.car_id,
    type: m.type ?? "repair",
    issue: m.issue ?? m.description ?? "",
    status: (m.status ?? "pending") as any,
    startDate: m.start_date ? new Date(m.start_date) : new Date(),
    endDate: m.end_date ? new Date(m.end_date) : undefined,
    estimatedCost: Number(m.estimated_cost ?? m.estimatedCost ?? 0),
    actualCost: (m.actual_cost ?? m.actualCost) != null
      ? Number(m.actual_cost ?? m.actualCost)
      : undefined,
    completedDate: (m.completedDate ?? m.completed_date)
      ? new Date(m.completedDate ?? m.completed_date)
      : undefined,
    mileageAtService: (m.mileageAtService ?? m.mileage_at_service) != null
      ? Number(m.mileageAtService ?? m.mileage_at_service)
      : undefined,
    serviceProvider: m.serviceProvider ?? m.service_provider ?? undefined,
    car: (m.cars || m.car) ? carFromDb(m.cars || m.car) : undefined,
    createdAt: (m.createdAt ?? m.created_at)
      ? new Date(m.createdAt ?? m.created_at)
      : new Date(),
    updatedAt: (m.updatedAt ?? m.updated_at)
      ? new Date(m.updatedAt ?? m.updated_at)
      : new Date(),
  };
}

// ============================================================
// REVIEW MAPPER
// ============================================================

export function reviewFromDb(r: any): IReview {
  if (!r) throw new Error("reviewFromDb: received null/undefined");
  return {
    reviewId: r.reviewId ?? r.id,
    bookingId: r.bookingId ?? r.booking_id,
    userId: r.userId ?? r.user_id,
    carId: r.carId ?? r.car_id,
    rating: Number(r.rating ?? 0),
    comment: r.comment ?? undefined,
    isVerified: r.isVerified ?? r.is_verified ?? true,
    user: (r.users || r.user)
      ? {
          userId: (r.users || r.user).id ?? (r.users || r.user).userId,
          name: (r.users || r.user).name ?? "",
          avatarUrl: (r.users || r.user).avatar_url ?? (r.users || r.user).avatarUrl,
        }
      : undefined,
    createdAt: (r.createdAt ?? r.created_at)
      ? new Date(r.createdAt ?? r.created_at)
      : new Date(),
  };
}

// ============================================================
// NOTIFICATION MAPPER
// ============================================================

export function notificationFromDb(n: any): INotification {
  if (!n) throw new Error("notificationFromDb: received null/undefined");
  return {
    id: n.id,
    userId: n.userId ?? n.user_id,
    title: n.title ?? "",
    message: n.message ?? undefined,
    type: n.type ?? "general",
    read: n.read ?? false,
    href: n.href ?? undefined,
    createdAt: (n.createdAt ?? n.created_at)
      ? new Date(n.createdAt ?? n.created_at)
      : new Date(),
  };
}
