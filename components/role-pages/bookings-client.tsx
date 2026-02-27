"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem,
  FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Eye, Edit, Trash2, DollarSign, FileText, Calendar, Car, User, Mail, CreditCard, Activity, Hash, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { manualBookingSchema, type ManualBookingFormValues } from "@/lib/schemas/booking-schema";
import type { BookingStatus } from "@/types";

// ─── Constants ──────────────────────────────────────────────────────────────

const BOOKING_STATUSES: { value: BookingStatus; label: string }[] = [
  { value: "pending",   label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected",  label: "Rejected" },
];

const STATUS_BADGE: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  rejected:  "bg-gray-100 text-gray-700",
};

const PAYMENT_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-700",
};

/** Returns first 8 chars of UUID for compact display */
const shortId = (id: string) => id?.slice(0, 8).toUpperCase() ?? "—";

// ─── Types ───────────────────────────────────────────────────────────────────

type CarLookup = {
  car_id: string;
  make: string;
  model: string;
};

type BookingRow = {
  id?: string;
  bookingId?: string;
  status?: string;
  bookingStatus?: string;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  total_amount?: number;
  totalAmount?: number;
  car_id?: string;
  carId?: string;
  payment_status?: string;
  paymentStatus?: string;
  payment_method?: string;
  paymentMethod?: string;
  paid_at?: string;
  paidAt?: string;
  invoiceUrl?: string;
  invoice_url?: string;
  cars?: { make: string; model: string } | null;
  car?: { make: string; model: string } | null;
  users?: { name: string; email: string } | null;
  user?: { name: string; email: string } | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(value?: string | null): string {
  if (!value) return "—";
  try { return format(new Date(value), "MMM d, yyyy"); }
  catch { return "—"; }
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  initialBookings: BookingRow[];
  cars?: CarLookup[];
  canManage?: boolean;
};

function BookingsClient({ initialBookings, cars = [], canManage = true, isAdmin = false }: Props & { isAdmin?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<BookingRow[]>(initialBookings ?? []);
  useEffect(() => setBookings(initialBookings ?? []), [initialBookings]);

  // ── Manual booking / Edit form ─────────────────────────────────────────────
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);

  const form = useForm<ManualBookingFormValues>({
    resolver: zodResolver(manualBookingSchema),
    defaultValues: {
      email: "", name: "", phone: "", carId: "",
      startDate: "", endDate: "", totalAmount: 0, paymentStatus: "pending",
    },
  });

  const openManualForm = () => {
    setEditingBookingId(null);
    form.reset({
      email: "", name: "", phone: "", carId: "",
      startDate: "", endDate: "", totalAmount: 0, paymentStatus: "pending",
    });
    setIsManualOpen(true);
  };

  const openEditForm = (b: BookingRow) => {
    const id = b.id ?? b.bookingId;
    if (!id) return;
    setEditingBookingId(id);
    form.reset({
      email: (b.users ?? b.user)?.email ?? "customer@example.com",
      name: (b.users ?? b.user)?.name ?? "Unknown",
      phone: "0000000000", // placeholder as we don't fetch phone in this table currently
      carId: b.car_id ?? b.carId ?? (b.cars && 'car_id' in b.cars ? (b.cars as any).car_id : (cars.find(c => c.make === (b.cars ?? b.car)?.make && c.model === (b.cars ?? b.car)?.model)?.car_id ?? "")),
      startDate: (b.start_date ?? b.startDate)?.split('T')[0] ?? "",
      endDate: (b.end_date ?? b.endDate)?.split('T')[0] ?? "",
      totalAmount: Number(b.total_amount ?? b.totalAmount ?? 0),
      paymentStatus: (b.status ?? b.bookingStatus) === "confirmed" ? "paid" : "pending", 
    });
    setIsManualOpen(true);
  };

  const onSubmit = async (data: ManualBookingFormValues) => {
    try {
      const url = editingBookingId ? `/api/bookings/${editingBookingId}` : "/api/bookings/manual";
      const method = editingBookingId ? "PATCH" : "POST";
      
      const payload = editingBookingId ? {
        carId: data.carId,
        startDate: data.startDate,
        endDate: data.endDate,
        totalAmount: data.totalAmount,
        paymentStatus: data.paymentStatus
      } : data;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Failed to ${editingBookingId ? 'update' : 'create'} booking`);

      toast({ title: `Booking ${editingBookingId ? 'updated' : 'created'}`, description: `Booking successfully ${editingBookingId ? 'updated' : 'added'}.` });
      setIsManualOpen(false);
      form.reset();
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // ── Cancel with reason ────────────────────────────────────────────────────
  const [cancelOpen, setCancelOpen]         = useState(false);
  const [cancelId, setCancelId]             = useState<string | null>(null);
  const [cancelReason, setCancelReason]     = useState("");

  const openCancelDialog = (id: string) => {
    setCancelId(id);
    setCancelOpen(true);
  };

  const confirmCancel = async () => {
    if (!cancelId || !cancelReason.trim()) return;
    try {
      const res  = await fetch(`/api/bookings/${cancelId}/admin-cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: cancelReason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to cancel booking");

      toast({ title: "Cancelled", description: "Booking cancelled successfully." });
      setCancelOpen(false);
      setCancelId(null);
      setCancelReason("");
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // ── Status change ─────────────────────────────────────────────────────────
  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    if (!canManage) return;

    if (newStatus === "cancelled") {
      openCancelDialog(bookingId);
      return;
    }

    try {
      const res  = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingStatus: newStatus }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to update status");

      toast({ title: "Status updated", description: `Booking is now ${newStatus}.` });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // ── Action Handlers ───────────────────────────────────────────────────────
  const [viewBookingParams, setViewBookingParams] = useState<BookingRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const confirmHardDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/bookings/${deleteId}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to delete booking");

      toast({ title: "Deleted", description: "Booking permanently deleted." });
      setBookings(prev => prev.filter(b => (b.id ?? b.bookingId) !== deleteId));
      setDeleteId(null);
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // ── Mark as Paid ──────────────────────────────────────────────────────────
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markPaidId, setMarkPaidId] = useState<string | null>(null);
  const [markPaidMethod, setMarkPaidMethod] = useState("cash");

  const openMarkPaid = (id: string) => {
    setMarkPaidId(id);
    setMarkPaidMethod("cash");
    setMarkPaidOpen(true);
  };

  const confirmMarkPaid = async () => {
    if (!markPaidId) return;
    try {
      const res = await fetch(`/api/bookings/${markPaidId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "paid", paymentMethod: markPaidMethod }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to mark paid");

      toast({ title: "Paid", description: "Booking marked as paid." });
      setMarkPaidOpen(false);
      setMarkPaidId(null);
      router.refresh();
      // Refelct change locally
      setBookings(prev => prev.map(b => (b.id ?? b.bookingId) === markPaidId ? { ...b, payment_status: "paid", paymentStatus: "paid", payment_method: markPaidMethod, paymentMethod: markPaidMethod } : b));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const rows = useMemo(() => bookings, [bookings]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Toolbar */}
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={openManualForm}>+ Manual Booking</Button>
          <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingBookingId ? "Edit Booking" : "Create Manual Booking"}</DialogTitle>
                <DialogDescription>
                  {editingBookingId ? "Update booking details below." : "Create a booking on behalf of a customer. Overlap rules still apply."}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Customer info (disabled when editing) */}
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input type="email" disabled={!!editingBookingId} placeholder="customer@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input disabled={!!editingBookingId} placeholder="Jane Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl><Input disabled={!!editingBookingId} placeholder="+1 (555) 000-0000" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Car */}
                    <FormField control={form.control} name="carId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Car <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a car" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cars.map((car) => (
                              <SelectItem key={car.car_id} value={car.car_id}>
                                {car.make} {car.model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Dates */}
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="endDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Amount */}
                    <FormField control={form.control} name="totalAmount" render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Total Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsManualOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Saving…" : (editingBookingId ? "Save Changes" : "Create Booking")}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Car</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="text-center py-12 text-muted-foreground">
                  No bookings found.
                </TableCell>
              </TableRow>
            ) : rows.map((b) => {
              const id     = b.id ?? b.bookingId ?? "";
              const car    = b.cars ?? b.car;
              const user   = b.users ?? b.user;
              const status = b.status ?? b.bookingStatus ?? "pending";

              return (
                <TableRow key={id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user?.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email ?? ""}</p>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {car ? `${car.make} ${car.model}` : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDate(b.start_date ?? b.startDate)}
                    {" → "}
                    {formatDate(b.end_date ?? b.endDate)}
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    ${Number(b.total_amount ?? b.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5 items-start">
                      <Badge className={PAYMENT_BADGE[b.payment_status ?? b.paymentStatus ?? "pending"] ?? "bg-gray-100"}>
                        {(b.payment_status ?? b.paymentStatus ?? "pending").toUpperCase()}
                      </Badge>
                      {(b.payment_method ?? b.paymentMethod) && (
                         <span className="text-xs text-muted-foreground capitalize whitespace-nowrap pl-0.5">
                           {String(b.payment_method ?? b.paymentMethod).replace('_', ' ')}
                         </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_BADGE[status] ?? "bg-gray-100 text-gray-700"}>
                      {BOOKING_STATUSES.find((s) => s.value === status)?.label ?? status}
                    </Badge>
                  </TableCell>

                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Select value={status} onValueChange={(v) => handleStatusChange(id, v as BookingStatus)}>
                          <SelectTrigger className="w-[130px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BOOKING_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewBookingParams(b)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditForm(b)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {canManage && (b.payment_status ?? b.paymentStatus) !== 'paid' && (
                              <DropdownMenuItem onClick={() => openMarkPaid(id)}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            {isAdmin && (
                              <DropdownMenuItem onClick={() => setDeleteId(id)} className="text-red-600 focus:bg-red-50 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* View Booking Details Modal */}
      <Dialog open={!!viewBookingParams} onOpenChange={(open) => !open && setViewBookingParams(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Detailed information for booking #{viewBookingParams ? shortId(viewBookingParams.id ?? viewBookingParams.bookingId ?? "") : ""}.
            </DialogDescription>
          </DialogHeader>
          {viewBookingParams && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Car className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg leading-none">{(viewBookingParams.cars ?? viewBookingParams.car) ? `${(viewBookingParams.cars ?? viewBookingParams.car)?.make} ${(viewBookingParams.cars ?? viewBookingParams.car)?.model}` : "Unknown Car"}</h4>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">{(viewBookingParams.users ?? viewBookingParams.user)?.name ?? "Unknown Customer"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div className="space-y-1 col-span-2">
                  <p className="text-muted-foreground flex items-center gap-2"><Hash className="h-3 w-3" /> Booking ID</p>
                  <p className="font-mono text-xs truncate break-all" title={viewBookingParams.id ?? viewBookingParams.bookingId}>{viewBookingParams.id ?? viewBookingParams.bookingId ?? "—"}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-2"><Mail className="h-3 w-3" /> Email</p>
                  <p className="font-medium truncate" title={(viewBookingParams.users ?? viewBookingParams.user)?.email}>{(viewBookingParams.users ?? viewBookingParams.user)?.email ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-2"><Calendar className="h-3 w-3" /> Period</p>
                  <p className="font-medium text-xs">
                    {formatDate(viewBookingParams.start_date ?? viewBookingParams.startDate)} →<br/>
                    {formatDate(viewBookingParams.end_date ?? viewBookingParams.endDate)}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-2"><CreditCard className="h-3 w-3" /> Payment Method</p>
                  <p className="font-medium capitalize">{String(viewBookingParams.payment_method ?? viewBookingParams.paymentMethod ?? "—").replace('_', ' ')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-2"><Activity className="h-3 w-3" /> Payment Status</p>
                  <div>
                    <Badge className={PAYMENT_BADGE[viewBookingParams.payment_status ?? viewBookingParams.paymentStatus ?? "pending"] ?? "bg-gray-100"}>
                      {(viewBookingParams.payment_status ?? viewBookingParams.paymentStatus ?? "pending").toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-2"><Clock className="h-3 w-3" /> Paid At</p>
                  <p className="font-medium">{viewBookingParams.paid_at ?? viewBookingParams.paidAt ? formatDate(viewBookingParams.paid_at ?? viewBookingParams.paidAt) : "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-2"><Activity className="h-3 w-3" /> Booking Status</p>
                  <div>
                     <Badge className={STATUS_BADGE[viewBookingParams.status ?? viewBookingParams.bookingStatus ?? "pending"] ?? "bg-gray-100 text-gray-700"}>
                      {BOOKING_STATUSES.find((s) => s.value === (viewBookingParams.status ?? viewBookingParams.bookingStatus))?.label ?? (viewBookingParams.status ?? viewBookingParams.bookingStatus ?? "Pending")}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-4 flex justify-between mt-2 shadow-sm">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Days</span>
                  {/* Simplistic calculation of days if dates are valid, else dash */}
                  <span className="font-bold text-xl">
                    {(() => {
                      const s = new Date(viewBookingParams.start_date ?? viewBookingParams.startDate ?? "");
                      const e = new Date(viewBookingParams.end_date ?? viewBookingParams.endDate ?? "");
                      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
                         const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
                         return diff > 0 ? diff : 1;
                      }
                      return "—";
                    })()}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Total Amount</span>
                  <span className="font-bold text-xl text-primary">${Number(viewBookingParams.total_amount ?? viewBookingParams.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-between mt-4">
            <div className="flex gap-2">
              {viewBookingParams && (viewBookingParams.payment_status ?? viewBookingParams.paymentStatus) === 'paid' && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      toast({ title: "Loading...", description: "Fetching invoice..." });
                      const res = await fetch(`/api/bookings/${viewBookingParams.id ?? viewBookingParams.bookingId}/invoice`, { method: 'POST' });
                      const data = await res.json();
                      if (data.url) window.open(data.url, '_blank');
                      else throw new Error(data.error || "Failed to load invoice");
                    } catch (e: any) {
                      toast({ title: "Error", description: e.message, variant: "destructive" });
                    }
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Download Invoice
                </Button>
              )}
            </div>
            <Button variant="default" onClick={() => setViewBookingParams(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel with reason dialog */}
      <Dialog open={cancelOpen} onOpenChange={(open) => { setCancelOpen(open); if (!open) { setCancelId(null); setCancelReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel booking #{cancelId ? shortId(cancelId) : "—"}</DialogTitle>
            <DialogDescription>
              Provide a cancellation reason. This will be recorded for the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="cancel-reason">Reason <span className="text-destructive">*</span></Label>
            <Textarea
              id="cancel-reason"
              placeholder="e.g. Customer requested cancellation, car unavailable…"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Back</Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={!cancelReason.trim()}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid dialog */}
      <Dialog open={markPaidOpen} onOpenChange={(open) => { setMarkPaidOpen(open); if (!open) setMarkPaidId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Booking as Paid</DialogTitle>
            <DialogDescription>
              Select the payment method used by the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Payment Method</Label>
            <Select value={markPaidMethod} onValueChange={setMarkPaidMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="card">Card (Terminal/Manual)</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidOpen(false)}>Cancel</Button>
            <Button onClick={confirmMarkPaid}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you completely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the booking and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmHardDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Named exports for admin and staff ───────────────────────────────────────

export function AdminBookingsClient(props: { initialBookings: BookingRow[]; cars?: CarLookup[] }) {
  return <BookingsClient {...props} canManage isAdmin />;
}

export function StaffBookingsClient(props: { initialBookings: BookingRow[]; cars?: CarLookup[] }) {
  return <BookingsClient {...props} canManage isAdmin={false} />;
}
