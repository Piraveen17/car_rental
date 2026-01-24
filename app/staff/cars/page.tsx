"use client";

import { useEffect, useState } from "react";

import { useCarsStore } from "@/lib/store";

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
import { Plus, Pencil, Search } from "lucide-react";
import { CarPayload, CarStatus, ICar, TransmissionType } from "@/types";
import { ImageUpload } from "@/components/ui/image-upload";

/**
 * Local form type: keep features as a comma-separated string for UI convenience.
 * We omit/relax fields that are managed server-side (id, images, createdAt, updatedAt).
 */
type CarForm = Omit<
  Partial<ICar>,
  "features" | "images" | "createdAt" | "updatedAt"
> & {
  features: string; // comma-separated in the form UI
  images?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export default function StaffCarsPage() {
  // read from Zustand store — cars is the single source of truth (typed as Car[])
  const { cars, fetchCars, addCar, updateCar } = useCarsStore();
  const { toast } = useToast();

  // Form and UI state (explicit generics added)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [editingCar, setEditingCar] = useState<ICar | null>(null);

  // form state uses CarForm to avoid type issues between array fields and form string
  const [formData, setFormData] = useState<CarForm>({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    pricePerDay: 0,
    transmission: "automatic" as TransmissionType,
    seats: 5,
    fuelType: "",
    location: "",
    status: "active" as CarStatus,
    description: "",
    features: "",
    images: [""],
  });

  // Fetch cars on mount
  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  // Filter guard: cars is expected to be Car[] from the store
  const filteredCars = (cars ?? []).filter((car: ICar) => {
    const query = searchQuery.toLowerCase();
    return (
      car.make.toLowerCase().includes(query) ||
      car.model.toLowerCase().includes(query) ||
      car.location.toLowerCase().includes(query)
    );
  });

  const resetForm = () => {
    setFormData({
      make: "",
      model: "",
      year: new Date().getFullYear(),
      pricePerDay: 0,
      transmission: "automatic",
      seats: 5,
      fuelType: "",
      location: "",
      status: "active",
      description: "",
      features: "",
      images: [""],
    });
    setEditingCar(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build the payload expected by addCar/updateCar (Car-like object)
    const payload: CarPayload = {
      make: formData.make ?? "",
      model: formData.model ?? "",
      year: formData.year ?? new Date().getFullYear(),
      pricePerDay: formData.pricePerDay ?? 0,
      transmission: (formData.transmission as TransmissionType) ?? "automatic",
      seats: formData.seats ?? 5,
      fuelType: formData.fuelType ?? "",
      location: formData.location ?? "",
      status: (formData.status as CarStatus) ?? "active",
      description: formData.description ?? "",
      features:
        formData.features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean) ?? [],
      images:
        formData.images && formData.images.length > 0
          ? formData.images
          : [
              `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(
                `${formData.make ?? ""} ${formData.model ?? ""} car`
              )}`,
            ],
    };

    if (editingCar) {
      // updateCar expects (id, data)
      updateCar(editingCar.carId, payload);
      toast({
        title: "Car updated",
        description: `${formData.make} ${formData.model} has been updated.`,
      });
    } else {
      addCar(payload);
      toast({
        title: "Car added",
        description: `${formData.make} ${formData.model} has been added to the fleet.`,
      });
    }

    resetForm();
    setIsAddDialogOpen(false);
  };

  // Prefill form for editing — convert Car -> CarForm (features array -> csv string)
  const handleEdit = (car: ICar) => {
    setEditingCar(car);
    setFormData({
      make: car.make,
      model: car.model,
      year: car.year,
      pricePerDay: car.pricePerDay,
      transmission: car.transmission,
      seats: car.seats,
      fuelType: car.fuelType,
      location: car.location,
      status: car.status,
      description: car.description ?? "",
      features: (car.features ?? []).join(", "),
      images: car.images ?? [],
      createdAt: car.createdAt,
      updatedAt: car.updatedAt,
    });
    setIsAddDialogOpen(true);
  };

  const statusColors: Record<CarStatus, string> = {
    active: "bg-success text-success-foreground",
    inactive: "bg-muted text-muted-foreground",
    maintenance: "bg-warning text-warning-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Car Management</h1>
          <p className="text-muted-foreground">Manage your vehicle fleet</p>
        </div>

        {/* Add / Edit Dialog */}
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Car
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCar ? "Edit Car" : "Add New Car"}
              </DialogTitle>
              <DialogDescription>
                {editingCar
                  ? "Update the car details below."
                  : "Fill in the details to add a new car to your fleet."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={(e) =>
                      setFormData({ ...formData, make: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: Number.parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerDay">Price Per Day ($)</Label>
                  <Input
                    id="pricePerDay"
                    type="number"
                    value={formData.pricePerDay}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerDay: Number.parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transmission">Transmission</Label>
                  <Select
                    value={formData.transmission}
                    onValueChange={(value: TransmissionType) =>
                      setFormData({ ...formData, transmission: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic">Automatic</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seats">Seats</Label>
                  <Input
                    id="seats"
                    type="number"
                    value={formData.seats}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seats: Number.parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel Type</Label>
                  <Input
                    id="fuelType"
                    value={formData.fuelType}
                    onChange={(e) =>
                      setFormData({ ...formData, fuelType: e.target.value })
                    }
                    placeholder="Gasoline, Electric, Hybrid..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: CarStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Features (comma-separated)</Label>
                <Input
                  id="features"
                  value={formData.features}
                  onChange={(e) =>
                    setFormData({ ...formData, features: e.target.value })
                  }
                  placeholder="Bluetooth, Backup Camera, GPS..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                 <Label>Images</Label>
                 <ImageUpload 
                    value={formData.images?.filter(Boolean) || []} 
                    onChange={(urls) => setFormData({...formData, images: urls})}
                    onRemove={(url) => setFormData({...formData, images: formData.images?.filter((i) => i !== url) || []})}
                 />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsAddDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCar ? "Update Car" : "Add Car"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <CardTitle>Fleet Overview</CardTitle>
              <CardDescription>
                {(cars ?? []).length} vehicles in fleet
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Price/Day</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCars.map((car: ICar) => (
                  <TableRow key={String(car.carId)}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {car.make} {car.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {car.transmission} • {car.seats} seats
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{car.year}</TableCell>
                    <TableCell>${car.pricePerDay}</TableCell>
                    <TableCell>{car.location}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[car.status]}>
                        {car.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(car)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {/* Delete button removed for Staff */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
