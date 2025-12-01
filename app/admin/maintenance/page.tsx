"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useMaintenanceStore, useCarsStore } from "@/lib/store";
import Maintenance from "@/models/Maintenance";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { MaintenancePayload } from "@/types";

export default function AdminMaintenancePage() {
  const { records, fetchRecords, addRecord, updateRecord, deleteRecord } =
    useMaintenanceStore();
  const { cars, fetchCars, updateCar } = useCarsStore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  type MaintenanceStatus = "pending" | "fixed";

  const [formData, setFormData] = useState({
    carId: "",
    issue: "",
    cost: 0,
    date: format(new Date(), "yyyy-MM-dd"),
    status: "pending" as MaintenanceStatus,
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: MaintenancePayload = {
      carId: formData.carId,
      issue: formData.issue,
      cost: formData.cost,
      date: new Date(formData.date),
      status: formData.status,
    };

    if (editingRecord) {
      updateRecord(editingRecord, payload);
      toast({
        title: "Record updated",
        description: "Maintenance record has been updated.",
      });
    } else {
      addRecord(payload);
      // Update car status to maintenance if pending
      if (formData.status === "pending") {
        updateCar(formData.carId, { status: "maintenance" });
      }
      toast({
        title: "Record added",
        description: "Maintenance record has been created.",
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (recordId: string) => {
    const record = records.find((r) => r.recordId === recordId);
    if (record) {
      setEditingRecord(recordId);
      setFormData({
        carId: record.carId,
        issue: record.issue,
        cost: record.cost,
        date: format(new Date(record.date), "yyyy-MM-dd"),
        status: record.status,
      });
      setIsDialogOpen(true);
    }
  };

  const handleDelete = (recordId: string) => {
    deleteRecord(recordId);
    toast({
      title: "Record deleted",
      description: "Maintenance record has been removed.",
    });
  };

  const handleStatusChange = (
    recordId: string,
    newStatus: MaintenanceStatus
  ) => {
    const record = records.find((r) => r.recordId === recordId);
    if (record) {
      const updatedRecord = {
        ...record,
        status: newStatus,
      } as MaintenancePayload;
      updateRecord(recordId, updatedRecord);
      // Update car status based on maintenance status
      if (newStatus === "fixed") {
        updateCar(record.carId, { status: "active" });
      } else {
        updateCar(record.carId, { status: "maintenance" });
      }
      toast({
        title: "Status updated",
        description: `Maintenance marked as ${newStatus}.`,
      });
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchCars();
  }, [fetchRecords, fetchCars]);

  const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
  const pendingCount = records.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Management</h1>
          <p className="text-muted-foreground">
            Track vehicle maintenance and repairs
          </p>
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
                {editingRecord
                  ? "Update the maintenance details."
                  : "Log a new maintenance issue."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="carId">Vehicle</Label>
                <Select
                  value={formData.carId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, carId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {cars.map((car) => (
                      <SelectItem key={car.carId} value={car.carId}>
                        {car.make} {car.carModel} ({car.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue">Issue Description</Label>
                <Textarea
                  id="issue"
                  value={formData.issue}
                  onChange={(e) =>
                    setFormData({ ...formData, issue: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cost: Number.parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: MaintenanceStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRecord ? "Update" : "Add Record"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Wrench className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <Wrench className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {records.length - pendingCount}
                </p>
                <p className="text-sm text-muted-foreground">Fixed Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${totalCost.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Records</CardTitle>
          <CardDescription>{records.length} total records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const car = cars.find((c) => c.carId === record.carId);
                  return (
                    <TableRow key={record.recordId}>
                      <TableCell>
                        <p className="font-medium">
                          {car?.make} {car?.carModel}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {record.issue}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${record.cost}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={record.status}
                          onValueChange={(value: MaintenanceStatus) =>
                            handleStatusChange(record.recordId, value)
                          }
                        >
                          <SelectTrigger className="w-28">
                            <Badge
                              className={
                                record.status === "pending"
                                  ? "bg-warning text-warning-foreground"
                                  : "bg-success text-success-foreground"
                              }
                            >
                              {record.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="fixed">Fixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(record.recordId)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(record.recordId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
