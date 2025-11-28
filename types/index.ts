export type UserRole = "admin" | "customer"

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  nicPassport?: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type TransmissionType = "manual" | "automatic"
export type CarStatus = "active" | "inactive" | "maintenance"

export interface Car {
  id: string
  make: string
  model: string
  year: number
  pricePerDay: number
  transmission: TransmissionType
  seats: number
  fuelType: string
  images: string[]
  features: string[]
  location: string
  status: CarStatus
  description?: string
  createdAt: Date
  updatedAt: Date
}

export type PaymentStatus = "pending" | "paid" | "failed"
export type BookingStatus = "pending_payment" | "confirmed" | "cancelled" | "completed"

export interface Booking {
  id: string
  userId: string
  carId: string
  car?: Car
  user?: User
  startDate: Date
  endDate: Date
  totalAmount: number
  paymentStatus: PaymentStatus
  bookingStatus: BookingStatus
  invoiceUrl?: string
  createdAt: Date
  updatedAt: Date
}

export type DemoPaymentStatus = "pending" | "paid" | "failed"

export interface DemoPayment {
  id: string
  bookingId: string
  paymentId: string
  amount: number
  status: DemoPaymentStatus
  createdAt: Date
}

export type MaintenanceStatus = "pending" | "fixed"

export interface Maintenance {
  id: string
  carId: string
  car?: Car
  issue: string
  cost: number
  date: Date
  status: MaintenanceStatus
  createdAt: Date
  updatedAt: Date
}

export interface CarFilters {
  make?: string
  model?: string
  minYear?: number
  maxYear?: number
  transmission?: TransmissionType
  minSeats?: number
  maxSeats?: number
  minPrice?: number
  maxPrice?: number
  location?: string
  status?: CarStatus
}

export interface AnalyticsData {
  totalRevenue: number
  totalBookings: number
  activeBookings: number
  totalCars: number
  mostRentedCars: { car: Car; count: number }[]
  monthlyBookings: { month: string; count: number; revenue: number }[]
  maintenanceCosts: number
}
