import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Booking, Car, Maintenance, DemoPayment } from "@/types"
import { users, bookings, cars, maintenanceRecords, demoPayments } from "./data"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
}

interface CarsState {
  cars: Car[]
  addCar: (car: Omit<Car, "id" | "createdAt" | "updatedAt">) => void
  updateCar: (id: string, updates: Partial<Car>) => void
  deleteCar: (id: string) => void
}

interface BookingsState {
  bookings: Booking[]
  addBooking: (booking: Omit<Booking, "id" | "createdAt" | "updatedAt">) => string
  updateBooking: (id: string, updates: Partial<Booking>) => void
  getBookingsForUser: (userId: string) => Booking[]
}

interface MaintenanceState {
  records: Maintenance[]
  addRecord: (record: Omit<Maintenance, "id" | "createdAt" | "updatedAt">) => void
  updateRecord: (id: string, updates: Partial<Maintenance>) => void
  deleteRecord: (id: string) => void
}

interface PaymentsState {
  payments: DemoPayment[]
  initiatePayment: (bookingId: string, amount: number) => string
  completePayment: (paymentId: string) => boolean
  getPaymentStatus: (paymentId: string) => DemoPayment | undefined
}

interface ThemeState {
  theme: "light" | "dark"
  toggleTheme: () => void
  setTheme: (theme: "light" | "dark") => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, _password: string) => {
        const user = users.find((u) => u.email === email)
        if (user && user.isActive) {
          set({ user, isAuthenticated: true })
          return true
        }
        return false
      },
      register: async (name: string, email: string, _password: string) => {
        const existingUser = users.find((u) => u.email === email)
        if (existingUser) return false

        const newUser: User = {
          id: `user-${Date.now()}`,
          name,
          email,
          role: "customer",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        users.push(newUser)
        set({ user: newUser, isAuthenticated: true })
        return true
      },
      logout: () => set({ user: null, isAuthenticated: false }),
      updateProfile: (updates) => {
        const { user } = get()
        if (user) {
          const updatedUser = { ...user, ...updates, updatedAt: new Date() }
          const index = users.findIndex((u) => u.id === user.id)
          if (index !== -1) users[index] = updatedUser
          set({ user: updatedUser })
        }
      },
    }),
    { name: "auth-storage" },
  ),
)

export const useCarsStore = create<CarsState>()((set, get) => ({
  cars: cars,
  addCar: (carData) => {
    const newCar: Car = {
      ...carData,
      id: `car-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    cars.push(newCar)
    set({ cars: [...cars] })
  },
  updateCar: (id, updates) => {
    const index = cars.findIndex((c) => c.id === id)
    if (index !== -1) {
      cars[index] = { ...cars[index], ...updates, updatedAt: new Date() }
      set({ cars: [...cars] })
    }
  },
  deleteCar: (id) => {
    const index = cars.findIndex((c) => c.id === id)
    if (index !== -1) {
      cars.splice(index, 1)
      set({ cars: [...cars] })
    }
  },
}))

export const useBookingsStore = create<BookingsState>()((set, get) => ({
  bookings: bookings,
  addBooking: (bookingData) => {
    const newBooking: Booking = {
      ...bookingData,
      id: `booking-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    bookings.push(newBooking)
    set({ bookings: [...bookings] })
    return newBooking.id
  },
  updateBooking: (id, updates) => {
    const index = bookings.findIndex((b) => b.id === id)
    if (index !== -1) {
      bookings[index] = { ...bookings[index], ...updates, updatedAt: new Date() }
      set({ bookings: [...bookings] })
    }
  },
  getBookingsForUser: (userId) => {
    return bookings.filter((b) => b.userId === userId)
  },
}))

export const useMaintenanceStore = create<MaintenanceState>()((set) => ({
  records: maintenanceRecords,
  addRecord: (recordData) => {
    const newRecord: Maintenance = {
      ...recordData,
      id: `maint-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    maintenanceRecords.push(newRecord)
    set({ records: [...maintenanceRecords] })
  },
  updateRecord: (id, updates) => {
    const index = maintenanceRecords.findIndex((r) => r.id === id)
    if (index !== -1) {
      maintenanceRecords[index] = { ...maintenanceRecords[index], ...updates, updatedAt: new Date() }
      set({ records: [...maintenanceRecords] })
    }
  },
  deleteRecord: (id) => {
    const index = maintenanceRecords.findIndex((r) => r.id === id)
    if (index !== -1) {
      maintenanceRecords.splice(index, 1)
      set({ records: [...maintenanceRecords] })
    }
  },
}))

export const usePaymentsStore = create<PaymentsState>()((set, get) => ({
  payments: demoPayments,
  initiatePayment: (bookingId, amount) => {
    const paymentId = `demo-pay-${Date.now()}`
    const newPayment: DemoPayment = {
      id: `payment-${Date.now()}`,
      bookingId,
      paymentId,
      amount,
      status: "pending",
      createdAt: new Date(),
    }
    demoPayments.push(newPayment)
    set({ payments: [...demoPayments] })
    return paymentId
  },
  completePayment: (paymentId) => {
    const index = demoPayments.findIndex((p) => p.paymentId === paymentId)
    if (index !== -1) {
      demoPayments[index].status = "paid"
      set({ payments: [...demoPayments] })
      return true
    }
    return false
  },
  getPaymentStatus: (paymentId) => {
    return demoPayments.find((p) => p.paymentId === paymentId)
  },
}))

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      toggleTheme: () => {
        const newTheme = get().theme === "light" ? "dark" : "light"
        set({ theme: newTheme })
        if (typeof window !== "undefined") {
          document.documentElement.classList.toggle("dark", newTheme === "dark")
        }
      },
      setTheme: (theme) => {
        set({ theme })
        if (typeof window !== "undefined") {
          document.documentElement.classList.toggle("dark", theme === "dark")
        }
      },
    }),
    { name: "theme-storage" },
  ),
)
