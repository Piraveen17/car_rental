"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { ICar, IMaintenance, MaintenanceStatus } from "@/types";

// ─── Constants aligned to DB CHECK constraints ──────────────────────────────

const MAINTENANCE_STATUSES: { value: MaintenanceStatus; label: string }[] = [
  { value: "pending",     label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed",   label: "Completed" },
  { value: "cancelled",   label: "Cancelled" },
];

const MAINTENANCE_TYPES: { value: string; label: string }[] = [
  { value: "oil_change",     label: "Oil Change" },
  { value: "tire_rotation",  label: "Tire Rotation" },
  { value: "brake_service",  label: "Brake Service" },
  { value: "engine_repair",  label: "Engine Repair" },
  { value: "transmission",   label: "Transmission" },
  { value: "electrical",     label: "Electrical" },
  { value: "body_work",      label: "Body Work" },
  { value: "inspection",     label: "Inspection" },
  { value: "repair",         label: "General Repair" },
  { value: "other",          label: "Other" },
];

const STATUS_BADGE_VARIANT: Record<MaintenanceStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending:     "secondary",
  in_progress: "default",
  completed:   "outline",
  cancelled:   "destructive",
};

// ─── Form defaults ───────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  carId: "",
  issue: "",
  type: "repair",
  estimatedCost: 0,
  startDate: format(new Date(), "yyyy-MM-dd"),
  endDate: "",
  status: "pending" as MaintenanceStatus,
};

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  initialRecords: IMaintenance[];
  cars: ICar[];
};

export function AdminMaintenanceClient({ initialRecords, cars }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen]   = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [deleteId, setDeleteId]           = useState<string | null>(null);
  const [saving, setSaving]               = useState(false);

  const [form, setForm] = useState(DEFAULT_FORM);

  // ── Summary stats ─────────────────────────────────────────────────────────

  const totalEstimatedCost = useMemo(
    () => (initialRecords ?? []).reduce((sum, r) => sum + (r.estimatedCost || 0), 0),
    [initialRecords]
  );
  const pendingCount = useMemo(
    () => (initialRecords ?? []).filter((r) => r.status === "pending" || r.status === "in_progress").length,
    [initialRecords]
  );

  // ── Helpers ───────────────────────────────────────────────────────────────

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
  };

  const setField = <K extends keyof typeof DEFAULT_FORM>(key: K, value: typeof DEFAULT_FORM[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Submit (create or update) ─────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      carId:         form.carId,
      issue:         form.issue,
      type:          form.type,
      estimatedCost: Number(form.estimatedCost || 0),
      startDate:     form.startDate,
      endDate:       form.endDate || undefined,
      status:        form.status,
    };

    try {
      const url    = editingId ? `/api/maintenance/${editingId}` : `/api/maintenance`;
      const method = editingId ? "PATCH" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to save record");
      }

      toast({
        title:       editingId ? "Record updated" : "Record created",
        description: editingId ? "Maintenance record updated." : "New maintenance record added.",
      });

      resetForm();
      setIsDialogOpen(false);
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────

  const handleEdit = (record: IMaintenance) => {
    setEditingId(record.recordId);
    setForm({
      carId:         record.carId,
      issue:         record.issue,
      type:          record.type ?? "repair",
      estimatedCost: record.estimatedCost ?? 0,
      startDate:     format(new Date(record.startDate), "yyyy-MM-dd"),
      endDate:       record.endDate ? format(new Date(record.endDate), "yyyy-MM-dd") : "",
      status:        record.status,
    });
    setIsDialogOpen(true);
  };

  // ── Quick status change (inline dropdown) ─────────────────────────────────

  const handleStatusChange = async (recordId: string, newStatus: MaintenanceStatus) => {
    try {
      const res = await fetch(`/api/maintenance/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast({ title: "Status updated", description: `Marked as ${newStatus.replace("_", " ")}.` });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/maintenance/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Record deleted" });
      setDeleteId(null);
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Estimated Costs</CardTitle>
            <CardDescription>Sum of estimated maintenance costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${totalEstimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Issues</CardTitle>
            <CardDescription>Pending + in-progress maintenance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Maintenance Records</h2>
          <p className="text-muted-foreground text-sm">Create, edit, and track all vehicle maintenance.</p>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Record" : "Add Maintenance Record"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update maintenance details." : "Log a new maintenance event for a vehicle."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">

              {/* Car */}
              <div className="space-y-1">
                <Label htmlFor="m-car">Car <span className="text-destructive">*</span></Label>
                <Select value={form.carId} onValueChange={(v) => setField("carId", v)} required>
                  <SelectTrigger id="m-car">
                    <SelectValue placeholder="Select a car" />
                  </SelectTrigger>
                  <SelectContent>
                    {cars.map((c) => (
                      <SelectItem key={c.carId} value={c.carId}>
                        {c.make} {c.model} ({c.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="space-y-1">
                <Label htmlFor="m-type">Maintenance Type</Label>
                <Select value={form.type} onValueChange={(v) => setField("type", v)}>
                  <SelectTrigger id="m-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description / Issue */}
              <div className="space-y-1">
                <Label htmlFor="m-issue">Description <span className="text-destructive">*</span></Label>
                <Input
                  id="m-issue"
                  placeholder="Describe the issue or work required"
                  value={form.issue}
                  onChange={(e) => setField("issue", e.target.value)}
                  required
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="m-start">Start Date <span className="text-destructive">*</span></Label>
                  <Input
                    id="m-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setField("startDate", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="m-end">End Date</Label>
                  <Input
                    id="m-end"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setField("endDate", e.target.value)}
                    min={form.startDate}
                  />
                </div>
              </div>

              {/* Estimated cost + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="m-cost">Estimated Cost ($)</Label>
                  <Input
                    id="m-cost"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.estimatedCost}
                    onChange={(e) => setField("estimatedCost", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="m-status">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setField("status", v as MaintenanceStatus)}
                  >
                    <SelectTrigger id="m-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MAINTENANCE_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Est. Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(initialRecords ?? []).map((r) => {
                const car = cars.find((c) => c.carId === r.carId);
                const typLabel = MAINTENANCE_TYPES.find((t) => t.value === r.type)?.label ?? r.type;
                return (
                  <TableRow key={r.recordId}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {car ? `${car.make} ${car.model}` : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{typLabel}</TableCell>
                    <TableCell className="max-w-[220px] truncate" title={r.issue}>
                      {r.issue}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.startDate ? format(new Date(r.startDate), "MMM dd, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      ${Number(r.estimatedCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={r.status}
                        onValueChange={(v) => handleStatusChange(r.recordId, v as MaintenanceStatus)}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MAINTENANCE_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setDeleteId(r.recordId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {(!initialRecords || initialRecords.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    No maintenance records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The maintenance record will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
