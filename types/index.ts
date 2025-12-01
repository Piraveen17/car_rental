import { CarStatus, ICar, TransmissionType } from "@/models/Car";

export type DemoPaymentStatus = "pending" | "paid" | "failed";

export interface DemoPayment {
  id: string;
  bookingId: string;
  paymentId: string;
  amount: number;
  status: DemoPaymentStatus;
  createdAt: Date;
}

export type MaintenanceStatus = "pending" | "fixed";

export interface MaintenancePayload {
  carId: string;
  issue: string;
  cost: number;
  date: Date;
  status: MaintenanceStatus;
}

export interface CarFilters {
  make?: string;
  carModel?: string;
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
