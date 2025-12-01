// stores.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { users } from "./data"; // local seed user array (assumed to use `id` field)
import type { IUser } from "@/models/User";
import type { CarPayload, ICar } from "@/models/Car";
import type { BookingPayload, IBooking } from "@/models/Booking";
import type { IMaintenance } from "@/models/Maintenance";
import type { DemoPayment, MaintenancePayload } from "@/types";

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
  logout: () => void;
  updateProfile: (updates: Partial<IUser>) => void;
  /** optional: load existing users from local seed - not persisted here */
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      /**
       * Simple login using local `users` seed array.
       * Real app: call backend auth endpoint and set tokens accordingly.
       */
      login: async (email: string, _password: string) => {
        const found = users.find((u: IUser) => u.email === email && u.isActive);
        if (found) {
          set({ user: found, isAuthenticated: true });
          return true;
        }
        return false;
      },

      register: async (name: string, email: string, _password: string) => {
        const exists = users.find((u: IUser) => u.email === email);
        if (exists) return false;

        const newUser: IUser = {
          userId: uuidv4(),
          name,
          email,
          role: "customer",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as IUser; // cast if your IUser has optional fields

        users.push(newUser);
        set({ user: newUser, isAuthenticated: true });
        return true;
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      updateProfile: (updates: Partial<IUser>) => {
        const current = get().user;
        if (!current) return;

        const updated: IUser = {
          ...current,
          ...updates,
          updatedAt: new Date(),
        } as IUser;
        // update local seeded users array if present
        const idx = users.findIndex((u: IUser) => u.userId === current.userId);
        if (idx !== -1) users[idx] = { ...users[idx], ...updated };

        set({ user: updated });
      },
    }),
    {
      name: "auth-storage",
      // optionally: getStorage: () => sessionStorage,
    }
  )
);

/* ---------------------- Cars store ---------------------- */
// helper: normalize server car -> ICar used by the UI
function normalizeCarFromServer(c: any): ICar {
  return {
    ...c,
    // prefer explicit carId, then id, then _id; fallback generate (shouldn't be necessary normally)
    carId: c.carId ?? c._id ?? uuidv4(),
    // ensure dates are Date objects in client state
    createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
    updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
    // keep other properties as-is
  } as ICar;
}

export const useCarsStore = create<CarsState>((set, get) => ({
  cars: [],

  fetchCars: async () => {
    try {
      const res = await fetch("/api/cars");
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
    const localNewCar: ICar = {
      ...carData,
      carId: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ICar;

    try {
      const res = await fetch("/api/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localNewCar),
      });

      if (res.ok) {
        const saved = await res.json();
        const normalized = normalizeCarFromServer(saved);
        set((state) => ({ cars: [...state.cars, normalized] }));
        return normalized;
      } else {
        // server returned non-ok, fallback to local
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (error) {
      console.info("Add car API failed; saving locally.", error);
      set((state) => ({ cars: [...state.cars, localNewCar] }));
      return localNewCar;
    }
  },

  // updated updateCar — apply server response if available, else fallback local update
  updateCar: async (
    carId: string,
    updates: Partial<CarPayload>
  ): Promise<void> => {
    try {
      const res = await fetch(`/api/cars/${carId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

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
        // resource not found on server — still apply local update
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
      const res = await fetch(`/api/cars/${carId}`, {
        method: "DELETE",
      });
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

export const useBookingsStore = create<BookingsState>((set, get) => ({
  bookings: [],

  fetchBookings: async () => {
    try {
      const res = await fetch("/api/bookings");
      if (!res.ok)
        throw new Error(`Failed to fetch bookings: ${res.statusText}`);
      const data: IBooking[] = await res.json();
      set({ bookings: Array.isArray(data) ? data : [] });
    } catch (error) {
      console.error("Error fetching bookings:", error);
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
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBooking),
      });

      if (res.ok) {
        const saved = await res.json();
        set((s) => ({ bookings: [...s.bookings, saved] }));
        return saved.bookingId;
      }
    } catch (err) {
      console.info("Booking API not available; saving locally.", err);
    }

    set((s) => ({ bookings: [...s.bookings, newBooking] }));
    return newBooking.bookingId;
  },

  updateBooking: async (bookingId, updates) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
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
      const res = await fetch("/api/maintenance");
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
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });

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
      const res = await fetch(`/api/maintenance/${recordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
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
      const res = await fetch(`/api/maintenance/${recordId}`, {
        method: "DELETE",
      });
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
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPayment),
      });

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
      const res = await fetch("/api/payments/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });

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
