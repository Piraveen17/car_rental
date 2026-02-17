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
import type { ICar, IMaintenance, MaintenancePayload, MaintenanceStatus } from "@/types";

type Props = {
  initialRecords: IMaintenance[];
  cars: ICar[];
};

export function AdminMaintenanceClient({ initialRecords, cars }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    carId: "",
    issue: "",
    cost: 0,
    date: format(new Date(), "yyyy-MM-dd"),
    status: "pending" as MaintenanceStatus,
  });

  const totalCost = useMemo(
    () => (initialRecords || []).reduce((sum, r) => sum + (r.cost || 0), 0),
    [initialRecords]
  );
  const pendingCount = useMemo(
    () => (initialRecords || []).filter((r) => r.status === "pending").length,
    [initialRecords]
  );

  const resetForm = () => {
    setFormData({
      carId: "",
      issue: "",
      cost: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      status: "pending",
    });
    setEditingRecord(null);
  };

  const updateCarStatus = async (carId: string, status: string) => {
    try {
      await fetch(`/api/cars/${carId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      // best-effort
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: MaintenancePayload = {
      carId: formData.carId,
      issue: formData.issue,
      cost: Number(formData.cost || 0),
      date: new Date(formData.date),
      status: formData.status,
    };

    try {
      if (editingRecord) {
        const res = await fetch(`/api/maintenance/${editingRecord}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed");
        toast({ title: "Record updated", description: "Maintenance record updated." });
      } else {
        const res = await fetch(`/api/maintenance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed");

        // When a new pending maintenance is created, mark car as maintenance.
        await updateCarStatus(formData.carId, "maintenance");

        toast({ title: "Record added", description: "Maintenance record created." });
      }

      resetForm();
      setIsDialogOpen(false);
      router.refresh();
    } catch {
      toast({
        title: "Error",
        description: "Failed to save maintenance record",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (recordId: string) => {
    const record = (initialRecords || []).find((r) => r.recordId === recordId);
    if (!record) return;

    setEditingRecord(recordId);
    setFormData({
      carId: record.carId,
      issue: record.issue,
      cost: record.cost,
      date: format(new Date(record.date), "yyyy-MM-dd"),
      status: record.status,
    });
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/maintenance/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");

      toast({ title: "Record deleted", description: "Maintenance record removed." });
      setDeleteId(null);
      router.refresh();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete maintenance record",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (recordId: string, newStatus: MaintenanceStatus) => {
    const record = (initialRecords || []).find((r) => r.recordId === recordId);
    if (!record) return;

    const cleanPayload: MaintenancePayload = {
      carId: record.carId,
      issue: record.issue,
      cost: record.cost,
      date: typeof record.date === "string" ? new Date(record.date) : record.date,
      status: newStatus,
    };

    try {
      const res = await fetch(`/api/maintenance/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanPayload),
      });
      if (!res.ok) throw new Error("Failed");

      // Update car status based on maintenance status
      if (newStatus === "fixed") await updateCarStatus(record.carId, "active");
      else await updateCarStatus(record.carId, "maintenance");

      toast({ title: "Status updated", description: `Maintenance marked as ${newStatus}.` });
      router.refresh();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update maintenance status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Total Cost
            </CardTitle>
            <CardDescription>All maintenance cost sum</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCost.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending</CardTitle>
            <CardDescription>Open maintenance issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Records</h2>
          <p className="text-muted-foreground">Create, edit, and manage maintenance records.</p>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? "Edit Record" : "Add Maintenance Record"}
              </DialogTitle>
              <DialogDescription>
                {editingRecord ? "Update maintenance details." : "Log a new maintenance issue."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Car</Label>
                <Select
                  value={formData.carId}
                  onValueChange={(v) => setFormData((p) => ({ ...p, carId: v }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select car" />
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

              <div className="space-y-2">
                <Label>Issue</Label>
                <Input
                  value={formData.issue}
                  onChange={(e) => setFormData((p) => ({ ...p, issue: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cost</Label>
                  <Input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData((p) => ({ ...p, cost: Number(e.target.value) }))}
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData((p) => ({ ...p, status: v as MaintenanceStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingRecord ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(initialRecords || []).map((r) => {
                const car = cars.find((c) => c.carId === r.carId);
                return (
                  <TableRow key={r.recordId}>
                    <TableCell className="font-medium">
                      {car ? `${car.make} ${car.model}` : r.carId}
                    </TableCell>
                    <TableCell>{r.issue}</TableCell>
                    <TableCell>
                      {r.date ? format(new Date(r.date as any), "MMM dd, yyyy") : "-"}
                    </TableCell>
                    <TableCell>{Number(r.cost || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Select
                        value={r.status}
                        onValueChange={(v) => handleStatusChange(r.recordId, v as MaintenanceStatus)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="fixed">Fixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(r.recordId)}>
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

              {(!initialRecords || initialRecords.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    No maintenance records found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
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
