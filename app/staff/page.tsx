"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCarsStore,
  useBookingsStore,
  useMaintenanceStore,
  useUsersStore,
} from "@/lib/store";
import { useEffect } from "react";
import {
  Car,
  Calendar,
  Users,
  Wrench,
  AlertCircle,
} from "lucide-react";

export default function StaffDashboard() {
  const { cars, fetchCars } = useCarsStore();
  const { bookings, fetchBookings } = useBookingsStore();
  const { records: maintenanceRecords, fetchRecords } = useMaintenanceStore();
  const { users, fetchUsers } = useUsersStore();

  useEffect(() => {
    fetchCars();
    fetchBookings();
    fetchRecords();
    fetchUsers();
  }, [fetchCars, fetchBookings, fetchRecords, fetchUsers]);

  const activeBookings = bookings.filter(
    (b) => b.bookingStatus === "confirmed" && new Date(b.endDate) >= new Date()
  ).length;

  const pendingBookings = bookings.filter(
    (b) => b.bookingStatus === "pending_payment"
  ).length;

  const activeCars = cars.filter((c) => c.status === "active").length;
  const maintenanceCars = cars.filter((c) => c.status === "maintenance").length;

  const totalCustomers = users.filter((u) => u.role === "customer").length;

  const pendingMaintenance = maintenanceRecords.filter(
    (m) => m.status === "pending"
  ).length;

  const recentBookings = bookings
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of daily operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Bookings</p>
                <p className="text-2xl font-bold">{activeBookings}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
            {pendingBookings > 0 && (
              <div className="flex items-center gap-1 mt-2 text-sm text-warning">
                <AlertCircle className="h-4 w-4" />
                <span>{pendingBookings} pending payment</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fleet Status</p>
                <p className="text-2xl font-bold">
                  {activeCars}/{cars.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-chart-2/10 flex items-center justify-center">
                <Car className="h-6 w-6 text-chart-2" />
              </div>
            </div>
            {maintenanceCars > 0 && (
              <div className="flex items-center gap-1 mt-2 text-sm text-warning">
                <Wrench className="h-4 w-4" />
                <span>{maintenanceCars} in maintenance</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-chart-4/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Maintenance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending Issues</span>
                <span className="font-semibold">{pendingMaintenance}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Cars in Maintenance
                </span>
                <span className="font-semibold">{maintenanceCars}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest booking activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBookings.map((booking) => {
                const car = cars.find((c) => c.carId === booking.carId);
                const customer = users.find((u) => u.userId === booking.userId);
                return (
                  <div
                    key={booking.bookingId}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {car?.make} {car?.model}
                      </p>
                      <p className="text-muted-foreground">{customer?.name}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xs ${
                          booking.paymentStatus === "paid"
                            ? "text-success"
                            : "text-warning"
                        }`}
                      >
                        {booking.paymentStatus}
                      </p>
                    </div>
                  </div>
                );
              })}
              {recentBookings.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent bookings</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
