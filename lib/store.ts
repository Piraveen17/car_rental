import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { IUser, UserRole } from "@/types";
import type { CarPayload, ICar } from "@/types";
import type { BookingPayload, IBooking } from "@/types";
import type { IMaintenance } from "@/types";
import type { DemoPayment, MaintenancePayload } from "@/types";
import { apiClient } from "@/lib/api-client";
import { carFromDb, bookingFromDb } from "@/lib/mappers";

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
  carsMeta?: { total: number; page: number; pageSize: number; totalPages: number };
  /**
   * Fetch cars using optional URL query params (SEO/shareable list pages).
   * Pass either a query string (e.g. "q=toyota&page=2") or URLSearchParams.
   */
  fetchCars: (query?: string | URLSearchParams) => Promise<void>;
  addCar: (car: CarPayload) => Promise<ICar>;
  updateCar: (id: string, updates: Partial<CarPayload>) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;
}

interface BookingsState {
  bookings: IBooking[];
  fetchBookings: () => Promise<void>;
  fetchMyBookings: () => Promise<void>;
  addBooking: (booking: BookingPayload) => Promise<string>;
  updateBooking: (id: string, updates: Partial<BookingPayload>) => Promise<void>;
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
      
      updateProfile: async (updates: Partial<IUser>) => {
        const current = get().user;
        if (!current) return;
        
        try {
            await apiClient.patch("/users/me", updates);
            // Optimistic update
            const updated = { ...current, ...updates, updatedAt: new Date() } as IUser;
            set({ user: updated });
        } catch (error) {
            console.error("Failed to update profile", error);
            // Revert or show error? For now just log.
        }
      },
      setHydrated: () => set({ isHydrated: true }),
      
      checkSession: async () => {
         const supabase = createClient();
         const { data: { user } } = await supabase.auth.getUser();
         
         
         if (user) {
             // ALWAYS fetch role from database (single source of truth)
             // This ensures role changes in Supabase Dashboard take effect immediately
             // Keep name/phone from metadata for performance (can be stale, less critical)
             let name: string | undefined = user.user_metadata?.name;
             let phone: string | undefined = user.phone || undefined;
             let role: string | undefined;

             try {
               // Query database for role (and other fields if metadata is missing)
               const { data: profile } = await supabase
                 .from('users')
                 .select('role,name,phone')
                 .eq('id', user.id)
                 .maybeSingle();
               
               
               if (profile) {
                 role = profile.role;  // Database is always source of truth for role
                 name = name ?? profile.name;
                 phone = phone ?? profile.phone;
               }
             } catch (error) {
               console.error("[checkSession] DB query failed:", error);
               // Fallback to metadata only if database query fails
               role = user.user_metadata?.role;
             }
             
             const mappedUser: IUser = {
                 userId: user.id,
                 clerkUserId: user.id, // For compat
                 email: user.email || "",
                 name: name || "",
                 role: (role as UserRole) || "customer",
                 phone: phone || "",
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
function normalizeCarFromServer(c: any): ICar {
  return carFromDb(c);
}

export const useCarsStore = create<CarsState>((set, get) => ({
  cars: [],
  carsMeta: undefined,

  fetchCars: async (query) => {
    try {
      const qs =
        typeof query === "string"
          ? query
          : query instanceof URLSearchParams
          ? query.toString()
          : "";

      const path = qs ? `/cars?${qs}` : "/cars";
      const res = await apiClient.get(path);
      if (!res.ok) throw new Error(`Failed to fetch cars: ${res.statusText}`);
      const data: any = await res.json();
      const items = Array.isArray(data) ? data : (data?.items ?? []);
      const cars = Array.isArray(items) ? items.map(normalizeCarFromServer) : [];
      const meta = Array.isArray(data)
        ? { total: cars.length, page: 1, pageSize: cars.length, totalPages: 1 }
        : data?.meta;
      set({ cars, carsMeta: meta });
    } catch (error) {
      console.error("Error fetching cars:", error);
      throw error;
    }
  },

  addCar: async (carData: CarPayload) => {
    try {
      // Send a clean payload (server manages createdAt/updatedAt)
      const payload = {
        ...carData,
        carId: uuidv4(),
      };

      const res = await apiClient.post("/cars", payload);

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
        carId: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ICar;
      set((state) => ({ cars: [...state.cars, newCar] }));
      return newCar;
    }
  },

  updateCar: async (
    carId: string,
    updates: Partial<CarPayload>
  ): Promise<void> => {
    try {
      const res = await apiClient.put(`/cars/${carId}`, updates);

      if (res.ok) {
        const saved = await res.json();
        const normalized = normalizeCarFromServer(saved);
        set((state) => ({
          cars: state.cars.map((c) =>
            c.carId === carId
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
            c.carId === carId ? { ...c, ...updates, updatedAt: new Date() } : c
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
          c.carId === carId ? { ...c, ...updates, updatedAt: new Date() } : c
        ) as ICar[],
      }));
      return;
    }
  },

  deleteCar: async (carId: string) => {
    try {
      const res = await apiClient.delete(`/cars/${carId}`);
      if (!res.ok && res.status !== 404) {
        throw new Error(
          `Failed to delete car: ${res.status} ${res.statusText}`
        );
      }
    } catch (err) {
      console.info("Delete car API failed; removing locally.", err);
    }

    set((state) => ({ cars: state.cars.filter((c) => c.carId !== carId) }));
  },
}));

/* ---------------------- Bookings store ---------------------- */
// helper: normalize server booking -> IBooking used by the UI
function normalizeBookingFromServer(b: any): IBooking {
  return {
    ...b, // Spread first to keep other props
    bookingId: b.bookingId ?? b.id ?? b._id ?? uuidv4(),
    // Map relations
    carId: b.carId ?? b.car_id ?? "",
    userId: b.userId ?? b.user_id ?? "",
    
    // handle field naming mismatch
    totalAmount: Number(b.totalAmount ?? b.totalPrice ?? 0),
    // ensure dates are Date objects
    startDate: b.startDate ? new Date(b.startDate) : new Date(),
    endDate: b.endDate ? new Date(b.endDate) : new Date(),
    createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
    updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date(),
    
    // Ensure relations are objects if present
    car: b.car ? normalizeCarFromServer(b.car) : undefined,
    // user: b.user ? normalizeUser(b.user) : undefined // If we had normalizeUser
    bookingStatus: b.bookingStatus ?? b.status ?? "pending",
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
      const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      const normalizedData = items.map(normalizeBookingFromServer);
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

    const res = await apiClient.post("/bookings", newBooking);
    if (!res.ok) {
      throw new Error(`Failed to create booking: ${res.statusText}`);
    }
    const saved = await res.json();
    const normalizedSaved = normalizeBookingFromServer(saved);
    set((s) => ({ bookings: [...s.bookings, normalizedSaved] }));
    return normalizedSaved.bookingId;
  },

  updateBooking: async (bookingId, updates) => {
    // Map bookingStatus to status for API
    const apiUpdates: any = { ...updates };
    if (updates.bookingStatus) {
      apiUpdates.status = updates.bookingStatus;
    }

    const res = await apiClient.put(`/bookings/${bookingId}`, apiUpdates);
    if (!res.ok) {
      throw new Error(`Failed to update booking: ${res.statusText}`);
    }

    const saved = await res.json().catch(() => null);
    if (saved) {
      const normalized = normalizeBookingFromServer(saved);
      set((state) => ({
        bookings: state.bookings.map((b) => (b.bookingId === bookingId ? normalized : b)) as IBooking[],
      }));
    } else {
      // If API doesn't return updated entity, re-fetch may be needed. Keep minimal local sync.
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.bookingId === bookingId ? { ...b, ...updates, updatedAt: new Date() } : b
        ) as IBooking[],
      }));
    }
  },

  getBookingsForUser: (userId) => {
    return get().bookings.filter((b) => (b as any).userId === userId);
  },
}));

/* ---------------------- Maintenance store ---------------------- */

function normalizeMaintenanceFromServer(m: any): IMaintenance {
  return {
    ...m,
    recordId: m.recordId ?? m.id ?? m._id ?? uuidv4(),
    carId: m.carId ?? m.car_id ?? "",
    cost: Number(m.cost ?? 0),
    date: m.date ? new Date(m.date) : new Date(),
    createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
    updatedAt: m.updatedAt ? new Date(m.updatedAt) : new Date(),
    car: m.car ? normalizeCarFromServer(m.car) : undefined,
  } as IMaintenance;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  records: [],

  fetchRecords: async () => {

    try {
      const res = await apiClient.get("/maintenance");
      if (!res.ok)
        throw new Error(`Failed to fetch maintenance: ${res.statusText}`);
      const data: any = await res.json();
      const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      const records = items.map(normalizeMaintenanceFromServer);
      set({ records });
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

    const res = await apiClient.post("/maintenance", newRecord);
    if (!res.ok) {
      throw new Error(`Failed to create maintenance record: ${res.statusText}`);
    }
    const saved = await res.json();
    const normalized = normalizeMaintenanceFromServer(saved);
    set((s) => ({ records: [...s.records, normalized] }));
    return normalized;
  },

  updateRecord: async (recordId, updates) => {
    const res = await apiClient.patch(`/maintenance/${recordId}`, updates);
    if (!res.ok) {
      throw new Error(`Failed to update maintenance record: ${res.statusText}`);
    }
    const saved = await res.json().catch(() => null);
    if (saved) {
      const normalized = normalizeMaintenanceFromServer(saved);
      set((state) => ({
        records: state.records.map((r) => (r.recordId === recordId ? normalized : r)) as IMaintenance[],
      }));
    }
  },

  deleteRecord: async (recordId) => {
    const res = await apiClient.delete(`/maintenance/${recordId}`);
    if (!res.ok) {
      throw new Error(`Failed to delete maintenance record: ${res.statusText}`);
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
        const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        set({ users: items });
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
