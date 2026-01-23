import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { IUser } from "@/types";
import type { CarPayload, ICar } from "@/types";
import type { BookingPayload, IBooking } from "@/types";
import type { IMaintenance } from "@/types";
import type { DemoPayment, MaintenancePayload } from "@/types";
import { apiClient } from "@/lib/api-client";

/**
 * NOTE: This file expects your model interfaces (IUser, ICar, IBooking, IMaintenance)
 * to use `id: string` as the primary identifier. If your real models have
 * different property names, either rename them here or adapt the models.
 */

/* ---------------------- Interfaces / State Shapes ---------------------- */

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<IUser>) => void;
  isHydrated: boolean;
  setHydrated: () => void;
  checkSession: () => Promise<void>;
}

interface CarsState {
  cars: ICar[];
  fetchCars: () => Promise<void>;
  addCar: (car: CarPayload) => Promise<ICar>;
  updateCar: (id: string, updates: Partial<CarPayload>) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;
}

interface BookingsState {
  bookings: IBooking[];
  fetchBookings: () => Promise<void>;
  fetchMyBookings: () => Promise<void>;
  addBooking: (booking: BookingPayload) => Promise<string>;
  updateBooking: (id: string, updates: BookingPayload) => Promise<void>;
  getBookingsForUser: (userId: string) => IBooking[];
}

interface MaintenanceState {
  records: IMaintenance[];
  fetchRecords: () => Promise<void>;
  addRecord: (payload: MaintenancePayload) => Promise<IMaintenance>;
  updateRecord: (id: string, payload: MaintenancePayload) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
}

interface PaymentsState {
  payments: DemoPayment[];
  initiatePayment: (bookingId: string, amount: number) => Promise<string>;
  completePayment: (paymentId: string) => Promise<boolean>;
  getPaymentStatus: (paymentId: string) => DemoPayment | undefined;
}

interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

/* ---------------------- Auth store (persisted) ---------------------- */

import { createClient } from "@/lib/supabase/client";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,

      login: async (email, password) => {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            console.error(error.message);
            return false;
        }
        await get().checkSession();
        return true;
      },

      register: async (name, email, password) => {
        try {
          // Call API to create user with correct role
          const res = await apiClient.post("/auth/register", { name, email, password });
          
          if (!res.ok) {
            const errorData = await res.json();
            console.error("Registration failed:", errorData.error);
            return false;
          }

          // Auto-login after successful registration
          return await get().login(email, password);
        } catch (error: any) {
          console.error("Registration error:", error);
          return false;
        }
      },

      logout: async () => {
         const supabase = createClient();
         await supabase.auth.signOut();
         set({ user: null, isAuthenticated: false });
      },
      
      updateProfile: (updates: Partial<IUser>) => {
        const current = get().user;
        if (!current) return;
        const updated = { ...current, ...updates, updatedAt: new Date() } as IUser;
        set({ user: updated });
      },
      setHydrated: () => set({ isHydrated: true }),
      
      checkSession: async () => {
         const supabase = createClient();
         const { data: { user } } = await supabase.auth.getUser();
         
         if (user) {
             const mappedUser: IUser = {
                 userId: user.id,
                 clerkUserId: user.id, // For compat
                 email: user.email || "",
                 name: user.user_metadata?.name || "",
                 role: user.user_metadata?.role || "customer",
                 phone: user.phone || "",
                 isActive: !!user.email_confirmed_at, // Use email confirmation as proxy for active
                 createdAt: new Date(user.created_at),
                 updatedAt: new Date(user.last_sign_in_at || new Date())
             };
             set({ user: mappedUser, isAuthenticated: true });
         } else {
             set({ user: null, isAuthenticated: false });
         }
      },
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
        state?.checkSession();
      },
    }
  )
);


/* ---------------------- Cars store ---------------------- */
// helper: normalize server car -> ICar used by the UI
// helper: normalize server car -> ICar used by the UI
function normalizeCarFromServer(c: any): ICar {
  return {
    ...c,
    // Map snake_case to camelCase
    car_id: c.car_id ?? c.id ?? c._id ?? uuidv4(),
    pricePerDay: c.pricePerDay ?? c.price_per_day ?? 0,
    fuelType: c.fuelType ?? c.fuel_type ?? "Unknown",
    
    // ensure dates are Date objects in client state
    createdAt: c.createdAt ? new Date(c.createdAt) : (c.created_at ? new Date(c.created_at) : new Date()),
    updatedAt: c.updatedAt ? new Date(c.updatedAt) : (c.updated_at ? new Date(c.updated_at) : new Date()),
  } as ICar;
}

export const useCarsStore = create<CarsState>((set, get) => ({
  cars: [],

  fetchCars: async () => {
    try {
      const res = await apiClient.get("/cars");
      if (!res.ok) throw new Error(`Failed to fetch cars: ${res.statusText}`);
      const data: any = await res.json();
      const cars = Array.isArray(data) ? data.map(normalizeCarFromServer) : [];
      set({ cars });
    } catch (error) {
      console.error("Error fetching cars:", error);
      throw error;
    }
  },

  addCar: async (carData: CarPayload) => {

    try {
      const newCar: ICar = {
        ...carData,
        car_id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ICar;

      console.log("Add car API request:", newCar);
      const res = await apiClient.post("/cars", newCar);
      console.log("Add car API response:", res);

      if (res.ok) {
        const saved = await res.json();
        const normalized = normalizeCarFromServer(saved);
        set((state) => ({ cars: [...state.cars, normalized] }));
        return normalized;
      } else {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (error) {
      console.info("Add car API failed; saving locally.", error);
      const newCar: ICar = {
        ...carData,
        car_id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ICar;
      set((state) => ({ cars: [...state.cars, newCar] }));
      return newCar;
    }

  },

  updateCar: async (
    car_id: string,
    updates: Partial<CarPayload>
  ): Promise<void> => {
    try {
      const res = await apiClient.put(`/cars/${car_id}`, updates);

      if (res.ok) {
        const saved = await res.json();
        const normalized = normalizeCarFromServer(saved);
        set((state) => ({
          cars: state.cars.map((c) =>
            c.car_id === car_id
              ? {
                  ...c,
                  ...normalized,
                  updatedAt: new Date(normalized.updatedAt ?? Date.now()),
                }
              : c
          ) as ICar[],
        }));
        return;
      } else if (res.status === 404) {
        set((state) => ({
          cars: state.cars.map((c) =>
            c.car_id === car_id ? { ...c, ...updates, updatedAt: new Date() } : c
          ) as ICar[],
        }));
      } else {
        throw new Error(
          `Failed to update car: ${res.status} ${res.statusText}`
        );
      }
    } catch (err) {
      console.info("Update car API failed; will update locally.", err);
      set((state) => ({
        cars: state.cars.map((c) =>
          c.car_id === car_id ? { ...c, ...updates, updatedAt: new Date() } : c
        ) as ICar[],
      }));
      return;
    }
  },

  deleteCar: async (car_id: string) => {
    try {
      const res = await apiClient.delete(`/cars/${car_id}`);
      if (!res.ok && res.status !== 404) {
        throw new Error(
          `Failed to delete car: ${res.status} ${res.statusText}`
        );
      }
    } catch (err) {
      console.info("Delete car API failed; removing locally.", err);
    }

    set((state) => ({ cars: state.cars.filter((c) => c.car_id !== car_id) }));
  },
}));

/* ---------------------- Bookings store ---------------------- */
// helper: normalize server booking -> IBooking used by the UI
function normalizeBookingFromServer(b: any): IBooking {
  return {
    ...b,
    bookingId: b.bookingId ?? b.id ?? b._id ?? uuidv4(),
    // handle field naming mismatch
    totalAmount: b.totalAmount ?? b.totalPrice ?? 0,
    // ensure dates are Date objects
    startDate: b.startDate ? new Date(b.startDate) : new Date(),
    endDate: b.endDate ? new Date(b.endDate) : new Date(),
    createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
    updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date(),
  } as IBooking;
}

export const useBookingsStore = create<BookingsState>((set, get) => ({
  bookings: [],

  fetchBookings: async () => {
    
    try {
      const res = await apiClient.get("/bookings");
      if (!res.ok)
        throw new Error(`Failed to fetch bookings: ${res.statusText}`);
      const data = await res.json();
      const normalizedData = Array.isArray(data) ? data.map(normalizeBookingFromServer) : [];
      set({ bookings: normalizedData });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      throw error;
    }
  },

  fetchMyBookings: async () => {
      try {
        const res = await apiClient.get("/bookings/my-bookings");
        if (!res.ok) throw new Error(`Failed to fetch my bookings: ${res.statusText}`);
        const data = await res.json();
        const normalizedData = Array.isArray(data) ? data.map(normalizeBookingFromServer) : [];
        set({ bookings: normalizedData });
      } catch (error) {
          console.error("Error fetching my bookings:", error);
          throw error;
      }
  },

  addBooking: async (bookingData) => {
    const newBooking: IBooking = {
      ...bookingData,
      bookingId: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IBooking;

    try {
      const res = await apiClient.post("/bookings", newBooking);

      if (res.ok) {
        const saved = await res.json();
        const normalizedSaved = normalizeBookingFromServer(saved);
        set((s) => ({ bookings: [...s.bookings, normalizedSaved] }));
        return normalizedSaved.bookingId;
      }
    } catch (err) {
      console.info("Booking API not available; saving locally.", err);
    }

    set((s) => ({ bookings: [...s.bookings, newBooking] }));
    return newBooking.bookingId;
  },

  updateBooking: async (bookingId, updates) => {
    try {
      const res = await apiClient.put(`/bookings/${bookingId}`, updates);
      if (!res.ok && res.status !== 404) {
        throw new Error(`Failed to update booking: ${res.statusText}`);
      }
    } catch (err) {
      console.info("Booking update API missing; performing local update.", err);
    }

    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.bookingId === bookingId
          ? { ...b, ...updates, updatedAt: new Date() }
          : b
      ) as IBooking[],
    }));
  },

  getBookingsForUser: (userId) => {
    return get().bookings.filter((b) => (b as any).userId === userId);
  },
}));

/* ---------------------- Maintenance store ---------------------- */

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  records: [],

  fetchRecords: async () => {

    try {
      const res = await apiClient.get("/maintenance");
      if (!res.ok)
        throw new Error(`Failed to fetch maintenance: ${res.statusText}`);
      const data: IMaintenance[] = await res.json();
      set({ records: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
      throw error;
    }
  },

  addRecord: async (recordData) => {
    const newRecord: IMaintenance = {
      ...recordData,
      recordId: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IMaintenance;

    try {
      const res = await apiClient.post("/maintenance", newRecord);

      if (res.ok) {
        const saved = await res.json();
        set((s) => ({ records: [...s.records, saved] }));
        return saved;
      }
    } catch (err) {
      console.info("Maintenance API unavailable; saving locally.", err);
    }

    set((s) => ({ records: [...s.records, newRecord] }));
    return newRecord;
  },

  updateRecord: async (recordId, updates) => {
    try {
      const res = await apiClient.patch(`/maintenance/${recordId}`, updates); // Changed to patch
      if (!res.ok && res.status !== 404) {
        throw new Error(
          `Failed to update maintenance record: ${res.statusText}`
        );
      }
    } catch (err) {
      console.info("Maintenance update API missing; updating locally.", err);
    }

    set((state) => ({
      records: state.records.map((r) =>
        r.recordId === recordId
          ? { ...r, ...updates, updatedAt: new Date() }
          : r
      ) as IMaintenance[],
    }));
  },

  deleteRecord: async (recordId) => {
    try {
      const res = await apiClient.delete(`/maintenance/${recordId}`);
      if (!res.ok && res.status !== 404) {
        throw new Error(
          `Failed to delete maintenance record: ${res.statusText}`
        );
      }
    } catch (err) {
      console.info(
        "Maintenance delete API not available; deleting locally.",
        err
      );
    }

    set((state) => ({
      records: state.records.filter((r) => r.recordId !== recordId),
    }));
  },
}));

interface UsersState {
  users: IUser[];
  fetchUsers: () => Promise<void>;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  fetchUsers: async () => {

    try {
      const res = await apiClient.get("/users");
      if (res.ok) {
        const data = await res.json();
        set({ users: Array.isArray(data) ? data : [] });
      }
    } catch (error) {
       console.error("Failed to fetch users", error);
    }
  }
}));

/* ---------------------- Payments store ---------------------- */

export const usePaymentsStore = create<PaymentsState>((set, get) => ({
  payments: [],

  initiatePayment: async (bookingId, amount) => {
    const paymentId = `demo-pay-${Date.now()}`;
    const newPayment: DemoPayment = {
      id: `payment-${Date.now()}`,
      bookingId,
      paymentId,
      amount,
      status: "pending",
      createdAt: new Date(),
    } as DemoPayment;

    try {
      const res = await apiClient.post("/payments", newPayment);

      if (res.ok) {
        const saved = await res.json();
        set((s) => ({ payments: [...s.payments, saved] }));
        return (saved.paymentId ?? saved.id ?? paymentId) as string;
      }
    } catch (err) {
      console.info("Payments API not available; saving locally.", err);
    }

    set((s) => ({ payments: [...s.payments, newPayment] }));
    return paymentId;
  },

  completePayment: async (paymentId) => {
    try {
      const res = await apiClient.post("/payments/complete", { paymentId });

      if (res.ok) {
        set((state) => ({
          payments: state.payments.map((p) =>
            (p as any).paymentId === paymentId
              ? { ...(p as any), status: "paid" }
              : p
          ),
        }));
        return true;
      }
    } catch (err) {
      console.info(
        "Complete payment API not available; trying local update.",
        err
      );
    }

    const had = get().payments.some((p) => (p as any).paymentId === paymentId);
    if (had) {
      set((state) => ({
        payments: state.payments.map((p) =>
          (p as any).paymentId === paymentId
            ? { ...(p as any), status: "paid" }
            : p
        ),
      }));
      return true;
    }

    return false;
  },

  getPaymentStatus: (paymentId) => {
    return get().payments.find((p) => (p as any).paymentId === paymentId);
  },
}));

/* ---------------------- Theme store (persisted) ---------------------- */

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      toggleTheme: () => {
        const newTheme = get().theme === "light" ? "dark" : "light";
        set({ theme: newTheme });
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle(
            "dark",
            newTheme === "dark"
          );
        }
      },
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", theme === "dark");
        }
      },
    }),
    { name: "theme-storage" }
  )
);
