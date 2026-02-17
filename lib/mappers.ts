import type { IBooking, ICar } from "@/types";

function pickDefined(obj: Record<string, any>) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

export function carFromDb(c: any): ICar {
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
    createdAt: c.createdAt ? new Date(c.createdAt) : (c.created_at ? new Date(c.created_at) : new Date()),
    updatedAt: c.updatedAt ? new Date(c.updatedAt) : (c.updated_at ? new Date(c.updated_at) : new Date()),
  } as ICar;
}

export function carToDbInsert(payload: any) {
  return {
    car_id: payload.carId ?? payload.car_id,
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
  };
}

export function carToDbUpdate(payload: any) {
  const raw = carToDbInsert(payload);
  delete (raw as any).car_id;
  return pickDefined(raw);
}

export function bookingFromDb(b: any): IBooking {
  const startRaw = b.startDate ?? b.start_date;
  const endRaw = b.endDate ?? b.end_date;
  const createdRaw = b.createdAt ?? b.created_at;
  const updatedRaw = b.updatedAt ?? b.updated_at;

  return {
    ...b,
    bookingId: b.bookingId ?? b.id,
    carId: b.carId ?? b.car_id,
    userId: b.userId ?? b.user_id,
    baseAmount: Number(b.baseAmount ?? b.base_amount ?? 0),
    addonsAmount: Number(b.addonsAmount ?? b.addons_amount ?? 0),
    totalAmount: Number(b.totalAmount ?? b.total_amount ?? 0),
    paymentStatus: (b.paymentStatus ?? b.payment_status ?? "pending") as any,
    bookingStatus: (b.bookingStatus ?? b.status ?? "pending") as any,
    startDate: startRaw ? new Date(startRaw) : new Date(),
    endDate: endRaw ? new Date(endRaw) : new Date(),
    createdAt: createdRaw ? new Date(createdRaw) : new Date(),
    updatedAt: updatedRaw ? new Date(updatedRaw) : new Date(),
    car: (b.cars || b.car) ? carFromDb(b.cars || b.car) : undefined,
  } as IBooking;
}
