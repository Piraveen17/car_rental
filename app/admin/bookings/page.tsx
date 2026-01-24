"use client";

import { useEffect, useState } from "react";
import { useBookingsStore, useCarsStore, useUsersStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Search, Download, FileText } from "lucide-react";
import { BookingPayload, BookingStatus } from "@/types";

const statusConfig: Record<BookingStatus, { label: string; color: string }> = {
  pending: {
    label: "Pending Confirmation",
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

export default function AdminBookingsPage() {
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

  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [manualBookingData, setManualBookingData] = useState({
    email: '', name: '', phone: '', carId: '', startDate: '', endDate: '', totalAmount: 0
  });

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancelId, setBookingToCancelId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const handleManualBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const res = await fetch('/api/bookings/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(manualBookingData)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to create booking');
        }
        toast({ title: "Success", description: "Manual booking created" });
        setIsManualBookingOpen(false);
        fetchBookings();
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };


  const cancelBooking = async (bookingId: string, reason: string) => {
     try {
        const res = await fetch(`/api/bookings/${bookingId}/admin-cancel`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminNote: reason })
        });
        if (!res.ok) throw new Error('Failed to cancel');
        toast({ title: "Cancelled", description: "Booking cancelled successfully" });
        fetchBookings();
     } catch (error) {
        toast({ title: "Error", description: "Failed to cancel booking", variant: "destructive" });
     }
  };

  const confirmCancellation = () => {
      if (bookingToCancelId && cancellationReason) {
          cancelBooking(bookingToCancelId, cancellationReason);
          setCancelDialogOpen(false);
          setBookingToCancelId(null);
          setCancellationReason("");
      }
  };

  // Debug: Log any unexpected booking statuses
  useEffect(() => {
    bookings.forEach((booking) => {
      if (!statusConfig[booking.bookingStatus]) {
        console.warn(
          `Unexpected booking status: "${booking.bookingStatus}" for booking ${booking.bookingId}`
        );
      }
    });
  }, [bookings]);

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
    if (newStatus === 'cancelled') {
        setBookingToCancelId(bookingId);
        setCancelDialogOpen(true);
        return;
    }
    
    // ... rest of normal update
    const booking = bookings.find((b) => b.bookingId === bookingId);
    if (!booking) return;

    const updatedBooking: Partial<BookingPayload> = {
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
        <Dialog open={isManualBookingOpen} onOpenChange={setIsManualBookingOpen}>
           <DialogTrigger asChild>
              <Button>+ Manual Booking</Button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-[425px]">
             <DialogHeader>
               <DialogTitle>Create Manual Booking</DialogTitle>
               <DialogDescription>Enter booking details for walk-in or phone customers.</DialogDescription>
             </DialogHeader>
             <form onSubmit={handleManualBookingSubmit} className="space-y-4">
                <div className="grid gap-2">
                    <Label>Customer Email</Label>
                    <Input required type="email" value={manualBookingData.email} onChange={e => setManualBookingData({...manualBookingData, email: e.target.value})} />
                </div>
                <div className="grid gap-2">
                    <Label>Customer Name</Label>
                    <Input required value={manualBookingData.name} onChange={e => setManualBookingData({...manualBookingData, name: e.target.value})} />
                </div>
                <div className="grid gap-2">
                    <Label>Phone</Label>
                    <Input required value={manualBookingData.phone} onChange={e => setManualBookingData({...manualBookingData, phone: e.target.value})} />
                </div>
                <div className="grid gap-2">
                    <Label>Car</Label>
                    <Select onValueChange={(val) => setManualBookingData({...manualBookingData, carId: val})}>
                        <SelectTrigger><SelectValue placeholder="Select Car" /></SelectTrigger>
                        <SelectContent>
                            {cars.filter(c => c.status === 'active').map(car => (
                                <SelectItem key={car.carId} value={car.carId}>{car.make} {car.model} (${car.pricePerDay}/day)</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label>Start Date</Label>
                        <Input required type="date" onChange={e => setManualBookingData({...manualBookingData, startDate: e.target.value})} />
                    </div>
                     <div>
                        <Label>End Date</Label>
                        <Input required type="date" onChange={e => setManualBookingData({...manualBookingData, endDate: e.target.value})} />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label>Total Amount ($)</Label>
                    <Input required type="number" onChange={e => setManualBookingData({...manualBookingData, totalAmount: Number(e.target.value)})} />
                </div>
                <DialogFooter>
                    <Button type="submit">Create Booking</Button>
                </DialogFooter>
             </form>
           </DialogContent>
        </Dialog>
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
                    Pending Confirmation
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
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking, index) => {
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
                      <TableCell className="font-semibold">
                        ${booking.totalAmount}
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

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Cancel Booking</DialogTitle>
                  <DialogDescription>
                      Please provide a reason for cancelling this booking. This will be recorded in the system.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  <Label className="mb-2 block">Cancellation Reason</Label>
                  <Textarea 
                      placeholder="e.g. Customer requested cancellation via phone..." 
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                  />
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={confirmCancellation} disabled={!cancellationReason.trim()}>
                      Confirm Cancellation
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
