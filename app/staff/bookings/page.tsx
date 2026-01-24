"use client";

import { useEffect, useState } from "react";
import { useBookingsStore, useCarsStore, useUsersStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Search, Download, FileText } from "lucide-react";
import { BookingPayload, BookingStatus } from "@/types";

const statusConfig: Record<BookingStatus, { label: string; color: string }> = {
  pending: {
    label: "Pending",
    color: "bg-warning text-warning-foreground",
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-success text-success-foreground",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-destructive text-destructive-foreground",
  },
  completed: { label: "Completed", color: "bg-muted text-muted-foreground" },
};

export default function StaffBookingsPage() {
  const { bookings, fetchBookings, updateBooking } = useBookingsStore();
  const { cars, fetchCars } = useCarsStore();
  const { users, fetchUsers } = useUsersStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchBookings();
    fetchCars();
    fetchUsers();
  }, [fetchBookings, fetchCars, fetchUsers]);

  const filteredBookings = bookings
    .filter((booking) => {
      const car = cars.find((c) => c.carId === booking.carId);
      const customer = users.find((u) => u.userId === booking.userId) || { name: 'Unknown', email: 'N/A' };
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        car?.make.toLowerCase().includes(query) ||
        car?.model.toLowerCase().includes(query) ||
        customer?.name.toLowerCase().includes(query) ||
        customer?.email.toLowerCase().includes(query) ||
        booking.bookingId.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || booking.bookingStatus === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    const booking = bookings.find((b) => b.bookingId === bookingId);
    if (!booking) return;

    const updatedBooking: Partial<BookingPayload> = {
      ...booking,
      bookingStatus: newStatus,
    };

    updateBooking(bookingId, updatedBooking);
    const statusLabel = statusConfig[newStatus]?.label || newStatus;
    toast({
      title: "Status updated",
      description: `Booking status changed to ${statusLabel}`,
    });
  };

  const exportToCSV = () => {
    const headers = [
      "Booking ID",
      "Customer",
      "Car",
      "Start Date",
      "End Date",
      "Total",
      "Status",
      "Payment",
    ];
    const rows = filteredBookings.map((booking) => {
      const car = cars.find((c) => c.carId === booking.carId);
      const customer = users.find((u) => u.userId === booking.userId);
      return [
        booking.bookingId,
        customer?.name || "Unknown",
        `${car?.make} ${car?.model}`,
        format(new Date(booking.startDate), "yyyy-MM-dd"),
        format(new Date(booking.endDate), "yyyy-MM-dd"),
        booking.totalAmount,
        booking.bookingStatus,
        booking.paymentStatus,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();

    toast({
      title: "Export complete",
      description: "Bookings have been exported to CSV.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground">View and manage all bookings</p>
        </div>
        <Button onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>
                {filteredBookings.length} bookings found
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">
                    Pending
                  </SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => {
                  const car = cars.find((c) => c.carId === booking.carId);
                  const customer = users.find((u) => u.userId === booking.userId);
                  const status = statusConfig[booking.bookingStatus] || {
                    label: booking.bookingStatus || "Unknown",
                    color: "bg-secondary text-secondary-foreground",
                  };

                  return (
                    <TableRow key={booking.bookingId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {car?.make} {car?.model}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>
                            {format(new Date(booking.startDate), "MMM d, yyyy")}
                          </p>
                          <p className="text-muted-foreground">
                            to{" "}
                            {format(new Date(booking.endDate), "MMM d, yyyy")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={booking.bookingStatus}
                            onValueChange={(value: BookingStatus) =>
                              handleStatusChange(booking.bookingId, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">
                                Pending
                              </SelectItem>
                              <SelectItem value="confirmed">
                                Confirmed
                              </SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {booking.invoiceUrl && (
                            <Button variant="ghost" size="icon" asChild>
                              <a
                                href={booking.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FileText className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
