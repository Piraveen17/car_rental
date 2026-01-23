"use client"

import { useEffect, useState } from "react"
// import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUpload } from "@/components/image-upload";

export default function StaffSalesPage() {
  const [cars, setCars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<any>({
    make: "", model: "", year: "", price: "", mileage: "", 
    status: "available", description: "", images: [], features: []
  })
  

  useEffect(() => {
    fetchCars()
  }, [])

  const fetchCars = async () => {
    try {
      const res = await fetch("/api/sales")
      if (!res.ok) throw new Error("Failed to fetch cars")
      const data = await res.json()
      setCars(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simple mock for images/features handling for now
    const payload = {
       ...formData,
       year: parseInt(formData.year),
       price: parseInt(formData.price),
       mileage: parseInt(formData.mileage),
       features: typeof formData.features === 'string' ? formData.features.split(',').map((s:string) => s.trim()) : [],
       images: formData.images || []
    }

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create listing")
      }

      setOpen(false)
      fetchCars()
      setFormData({
         make: "", model: "", year: "", price: "", mileage: "", 
         status: "available", description: "", images: [], features: []
      })
    } catch (error: any) {
       alert(error.message)
    }
  }

  // Delete function removed for Staff

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Car Sales Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Car for Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
             <DialogHeader>
                <DialogTitle>Add New Car for Sale</DialogTitle>
             </DialogHeader>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Make</Label>
                      <Input value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} required />
                   </div>
                   <div className="space-y-2">
                      <Label>Model</Label>
                       <Input value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} required />
                   </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                   <div className="space-y-2">
                      <Label>Year</Label>
                      <Input type="number" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required />
                   </div>
                   <div className="space-y-2">
                       <Label>Price</Label>
                       <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                   </div>
                   <div className="space-y-2">
                        <Label>Mileage (km)</Label>
                        <Input type="number" value={formData.mileage} onChange={e => setFormData({...formData, mileage: e.target.value})} required />
                   </div>
                </div>
                
                <div className="space-y-2">
                   <Label>Status</Label>
                   <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                      <SelectTrigger>
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="available">Available</SelectItem>
                         <SelectItem value="sold">Sold</SelectItem>
                         <SelectItem value="reserved">Reserved</SelectItem>
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                 
                 <div className="space-y-2">
                    <Label>Images</Label>
                    <ImageUpload 
                        defaultImages={typeof formData.images === 'string' ? [] : formData.images}
                        onUploadComplete={(urls) => setFormData({...formData, images: urls})}
                    />
                 </div>
                 
                  <div className="space-y-2">
                    <Label>Features (comma separated)</Label>
                    <Input value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} placeholder="Leather seats, Sunroof..." />
                 </div>

                <Button type="submit" className="w-full">Create Listing</Button>
             </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
         <Table>
            <TableHeader>
               <TableRow>
                  <TableHead>Car</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead>Status</TableHead>
                  {/* Actions column simplified for Staff */}
               </TableRow>
            </TableHeader>
            <TableBody>
               {cars.map(car => (
                  <TableRow key={car.id}>
                     <TableCell className="font-medium">
                        {car.year} {car.make} {car.model}
                     </TableCell>
                     <TableCell>${car.price?.toLocaleString()}</TableCell>
                     <TableCell>{car.mileage?.toLocaleString()} km</TableCell>
                     <TableCell>
                        <Badge variant={car.status === 'available' ? 'default' : 'secondary'}>
                           {car.status}
                        </Badge>
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </div>
    </div>
  )
}
