// ============================================================
// Car Rental System - Complete Type Definitions
// ============================================================

// ----------------------------------------------------------
// USER TYPES
// ----------------------------------------------------------
export type UserRole = "admin" | "staff" | "customer";

export interface IUser {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  nicPassport?: string;
  role: UserRole;
  isActive: boolean;
  address?: string;
  city?: string;
  country?: string;
  dateOfBirth?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  emergencyContact?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------------------------------------------
// CAR TYPES
// ----------------------------------------------------------
export type TransmissionType = "manual" | "automatic";
export type FuelType = "petrol" | "diesel" | "electric" | "hybrid";
export type CarStatus = "active" | "inactive" | "maintenance";
export type CarCategory = "sedan" | "suv" | "hatchback" | "luxury" | "sports" | "minivan" | "pickup" | "coupe" | "convertible" | "economy";

export interface ICar {
  carId: string;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  transmission: TransmissionType;
  seats: number;
  fuelType: string;
  images: string[];
  features: string[];
  location: string;
  status: CarStatus;
  description?: string;
  category?: CarCategory;
  color?: string;
  licensePlate?: string;
  vin?: string;
  mileage?: number;
  minRentalDays?: number;
  maxRentalDays?: number;
  securityDeposit?: number;
  rating?: number;
  reviewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CarPayload = {
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  transmission: TransmissionType;
  seats: number;
  fuelType: string;
  location: string;
  status: CarStatus;
  description?: string;
  features: string[];
  images: string[];
  category?: CarCategory;
  color?: string;
  licensePlate?: string;
  vin?: string;
  mileage?: number;
  minRentalDays?: number;
  maxRentalDays?: number;
  securityDeposit?: number;
};

export interface CarFilters {
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  transmission?: TransmissionType | "all";
  minSeats?: number;
  maxSeats?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  status?: CarStatus;
  category?: CarCategory | "all";
  fuelType?: string;
  q?: string;
}

// ----------------------------------------------------------
// BOOKING TYPES
// ----------------------------------------------------------
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "rejected"
  | "completed";
export type BookingSource = "online" | "manual" | "api";

export interface BookingAddons {
  driver: boolean;
  driverQty?: number;
  extraKmQty: number;
  delivery: boolean;
  deliveryAddress?: string;
  // Extended addons (optional — original selector only sets the 3 above)
  childSeat?: boolean;
  childSeatQty?: number;
  gpsNavigation?: boolean;
  insurance?: boolean;
  insuranceType?: "basic" | "full";
}

export interface IBooking {
  bookingId: string;
  userId: string;
  carId: string;
  car?: ICar;
  user?: IUser;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  baseAmount?: number;
  addonsAmount?: number;
  depositAmount?: number;
  depositReturned?: boolean;
  paymentStatus: PaymentStatus;
  paymentMethod?: string; // allow any string from manual or 'card'/'bank' etc
  paidAt?: Date;
  bookingStatus: BookingStatus;
  bookingSource?: BookingSource;
  addons?: BookingAddons;
  invoiceUrl?: string;
  cancelReason?: string;
  cancelledBy?: "admin" | "staff" | "customer";
  cancelledAt?: Date;
  notes?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  actualReturnDate?: Date;
  lateFeeAmount?: number;
  damageReported?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingPayload = {
  userId: string;
  carId: string;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  baseAmount?: number;
  addonsAmount?: number;
  depositAmount?: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paidAt?: Date;
  bookingStatus: BookingStatus;
  bookingSource?: BookingSource;
  addons: BookingAddons;
  notes?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
};

// ----------------------------------------------------------
// MAINTENANCE TYPES
// ----------------------------------------------------------
export type MaintenanceStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type MaintenanceType =
  | "oil_change"
  | "tire_rotation"
  | "brake_service"
  | "engine_repair"
  | "transmission"
  | "electrical"
  | "body_work"
  | "inspection"
  | "repair"
  | "other";

export interface IMaintenance {
  recordId: string;
  carId: string;
  car?: ICar;
  /** Maps to DB `description` column */
  issue: string;
  type: MaintenanceType | string;
  status: MaintenanceStatus;
  startDate: Date;
  endDate?: Date;
  estimatedCost: number;
  actualCost?: number;
  completedDate?: Date;
  mileageAtService?: number;
  serviceProvider?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenancePayload {
  carId: string;
  type?: MaintenanceType | string;
  /** Maps to DB `description` column */
  issue: string;
  status: MaintenanceStatus;
  startDate: Date;
  endDate?: Date;
  estimatedCost?: number;
  actualCost?: number;
  mileageAtService?: number;
  serviceProvider?: string;
}

// ----------------------------------------------------------
// CAR UNAVAILABILITY
// ----------------------------------------------------------
export interface ICarUnavailable {
  id: string;
  carId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
  type: "maintenance" | "reserved" | "other";
  createdBy?: string;
  createdAt: Date;
}

// ----------------------------------------------------------
// PAYMENT TYPES
// ----------------------------------------------------------
export type PaymentMethod = "card" | "cash" | "bank" | "online";

export interface IPayment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  status: "pending" | "completed" | "failed" | "refunded";
  method?: PaymentMethod;
  transactionId?: string;
  gatewayRef?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvoice {
  id: string;
  bookingId: string;
  invoiceNo: string;
  pdfUrl: string;
  createdAt: Date;
}

// Legacy alias
export interface DemoPayment {
  id: string;
  bookingId: string;
  paymentId: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  createdAt: Date;
}

// ----------------------------------------------------------
// REVIEW TYPES
// ----------------------------------------------------------
export interface IReview {
  reviewId: string;
  bookingId: string;
  userId: string;
  carId: string;
  user?: Pick<IUser, "userId" | "name" | "avatarUrl">;
  rating: number;
  comment?: string;
  isVerified: boolean;
  createdAt: Date;
}

export type ReviewPayload = {
  bookingId: string;
  carId: string;
  rating: number;
  comment?: string;
};

// ----------------------------------------------------------
// NOTIFICATION TYPES
// ----------------------------------------------------------
export type NotificationType =
  | "booking_created"
  | "booking_confirmed"
  | "booking_rejected"
  | "booking_cancelled"
  | "booking_completed"
  | "payment_received"
  | "payment_failed"
  | "maintenance_due"
  | "car_returned"
  | "review_received"
  | "general";

export interface INotification {
  id: string;
  userId: string;
  /** NOT NULL in DB — always required */
  title: string;
  message?: string;
  type: NotificationType | string;
  read: boolean;
  href?: string;
  createdAt: Date;
}

// ----------------------------------------------------------
// ANALYTICS TYPES
// ----------------------------------------------------------
export interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  activeBookings: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalCars: number;
  availableCars: number;
  maintenanceCars: number;
  totalCustomers: number;
  mostRentedCars: { car: ICar; count: number; revenue: number }[];
  monthlyBookings: { month: string; count: number; revenue: number }[];
  maintenanceCosts: number;
  averageRating?: number;
  occupancyRate?: number;
  revenueGrowth?: number;
  bookingsByStatus: Record<BookingStatus, number>;
}

// ----------------------------------------------------------
// AVAILABILITY
// ----------------------------------------------------------
export interface BlockedDateRange {
  from: string;
  to: string;
  type: "booking" | "maintenance" | "reserved";
  reason?: string;
}

export interface CarAvailabilityResponse {
  carId: string;
  minDays: number;
  maxDays: number;
  blockedDates: BlockedDateRange[];
}

// ----------------------------------------------------------
// DAMAGE REPORT
// ----------------------------------------------------------
export type DamageSeverity = "minor" | "moderate" | "major";

export interface IDamageReport {
  id: string;
  bookingId: string;
  carId: string;
  reportedBy: string;
  description: string;
  severity: DamageSeverity;
  estimatedRepairCost?: number;
  images?: string[];
  /** DB CHECK: 'pending' | 'reviewed' | 'repaired' */
  status: "pending" | "reviewed" | "repaired";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------------------------------------------
// PAGINATION
// ----------------------------------------------------------
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
