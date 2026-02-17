"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { manualBookingSchema, type ManualBookingFormValues } from "@/lib/schemas/booking-schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { BookingStatus } from "@/types";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-warning text-warning-foreground" },
  confirmed: { label: "Confirmed", color: "bg-success text-success-foreground" },
  rejected: { label: "Rejected", color: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", color: "bg-destructive text-destructive-foreground" },
  completed: { label: "Completed", color: "bg-muted text-muted-foreground" },
};

type Props = {
  initialBookings: any[];
  cars?: any[];
  canManage?: boolean;
};

function BookingsClient({ initialBookings, cars = [], canManage = true }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>(initialBookings || []);

  // Keep UI updated when server props change after URL filter navigation.
  useEffect(() => setBookings(initialBookings || []), [initialBookings]);

  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  
  const form = useForm<ManualBookingFormValues>({
    resolver: zodResolver(manualBookingSchema),
    defaultValues: {
      email: "",
      name: "",
      phone: "",
      carId: "",
      startDate: "",
      endDate: "",
      totalAmount: 0,
      paymentStatus: "pending",
    },
  });

  const onSubmit = async (data: ManualBookingFormValues) => {
    try {
      const res = await fetch("/api/bookings/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to create booking");

      toast({ title: "Success", description: "Manual booking created" });
      setIsManualBookingOpen(false);
      form.reset();
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancelId, setBookingToCancelId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");



  const cancelBooking = async (bookingId: string, reason: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/admin-cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: reason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to cancel");
      toast({ title: "Cancelled", description: "Booking cancelled successfully" });
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to cancel booking", variant: "destructive" });
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

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    if (!canManage) return;
    if (newStatus === "cancelled") {
      setBookingToCancelId(bookingId);
      setCancelDialogOpen(true);
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingStatus: newStatus }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to update status");

      toast({ title: "Status updated", description: `Booking status changed to ${statusConfig[newStatus]?.label || newStatus}` });
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const rows = useMemo(() => bookings || [], [bookings]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {canManage ? (
          <Dialog open={isManualBookingOpen} onOpenChange={setIsManualBookingOpen}>
            <DialogTrigger asChild>
              <Button>+ Manual Booking</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Manual Booking</DialogTitle>
                <DialogDescription>
                  Staff/Admin can create a booking on behalf of a customer. Overlap rules apply.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="carId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Car</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a car" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cars.map((car: any) => (
                                <SelectItem key={car.car_id} value={car.car_id}>
                                  {car.make} {car.model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Amount</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        ) : (
          <div />
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Car</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              {canManage ? <TableHead className="text-right">Action</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="text-center py-10 text-muted-foreground">
                  No bookings found for current query.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((b: any) => {
                const car = b.cars || b.car;
                const user = b.users || b.user;
                const status = b.status || b.bookingStatus;
                return (
                  <TableRow key={b.id || b.bookingId}>
                    <TableCell className="font-mono text-xs">{b.id || b.bookingId}</TableCell>
                    <TableCell>{user?.name || "Unknown"}</TableCell>
                    <TableCell>{car ? `${car.make} ${car.model}` : b.car_id || b.carId}</TableCell>
                    <TableCell className="text-sm">
                      {b.start_date || b.startDate ? format(new Date(b.start_date || b.startDate), "yyyy-MM-dd") : "-"} →{" "}
                      {b.end_date || b.endDate ? format(new Date(b.end_date || b.endDate), "yyyy-MM-dd") : "-"}
                    </TableCell>
                    <TableCell>{b.total_amount ?? b.totalAmount ?? "-"}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig[status]?.color || "bg-muted text-muted-foreground"}>
                        {statusConfig[status]?.label || status}
                      </Badge>
                    </TableCell>

                    {canManage ? (
                      <TableCell className="text-right">
                        <Select value={status} onValueChange={(v) => handleStatusChange(b.id || b.bookingId, v as any)}>
                          <SelectTrigger className="w-[160px] ml-auto">
                            <SelectValue placeholder="Change" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cancel dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel booking</DialogTitle>
            <DialogDescription>Provide a reason. This will be stored in adminNote.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCancelDialogOpen(false)}>
              Close
            </Button>
            <Button variant="destructive" onClick={confirmCancellation} disabled={!cancellationReason}>
              Cancel booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AdminBookingsClient(props: { initialBookings: any[]; cars?: any[] }) {
  return <BookingsClient {...props} canManage />;
}

export function StaffBookingsClient(props: { initialBookings: any[]; cars?: any[] }) {
  return <BookingsClient {...props} canManage />;
}
