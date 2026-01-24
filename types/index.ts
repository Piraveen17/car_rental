
// User Types
export type UserRole = "admin" | "staff" | "customer";

export interface IUser {
  userId: string;
  clerkUserId?: string; // For compatibility migration
  name: string;
  email: string;
  phone?: string;
  nicPassport?: string;
  role: UserRole;
  // roles: string[]; // Deprecated, use role
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Car Types
export type TransmissionType = "manual" | "automatic";
export type CarStatus = "active" | "inactive" | "maintenance";

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
  createdAt: Date;
  updatedAt: Date;
  // Mongoose specific fields (optional compatibility)
  _id?: string;
  id?: string;
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
};

// Booking Types
export type PaymentStatus = "pending" | "paid" | "failed";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface BookingAddons {
  driver: boolean;
  extraKmQty: number; // 0 if none
  delivery: boolean;
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
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  _id?: string;
  id?: string;
}

export type BookingPayload = {
  userId: string;
  carId: string;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  invoiceUrl?: string;
  paymentStatus: string;
  bookingStatus: string;
  addons: BookingAddons;
};


// Maintenance Types
export type MaintenanceStatus = "pending" | "fixed";

export interface IMaintenance {
  recordId: string;
  carId: string;
  car?: ICar;
  issue: string;
  cost: number;
  date: Date;
  status: MaintenanceStatus;
  createdAt: Date;
  updatedAt: Date;
  _id?: string;
  id?: string;
}

export interface MaintenancePayload {
  carId: string;
  issue: string;
  cost: number;
  date: Date;
  status: MaintenanceStatus;
}

// Demo/Other Types
export type DemoPaymentStatus = "pending" | "paid" | "failed";

export interface DemoPayment {
  id: string;
  bookingId: string;
  paymentId: string;
  amount: number;
  status: DemoPaymentStatus;
  createdAt: Date;
}

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
}

export interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  activeBookings: number;
  totalCars: number;
  mostRentedCars: { car: ICar; count: number }[];
  monthlyBookings: { month: string; count: number; revenue: number }[];
  maintenanceCosts: number;
}
