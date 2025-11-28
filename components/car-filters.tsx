"use client"

import { useState } from "react"
import type { CarFilters, TransmissionType } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Filter, X } from "lucide-react"
import { getUniqueMakes, getUniqueLocations } from "@/lib/data"

interface CarFiltersProps {
  filters: CarFilters
  onFiltersChange: (filters: CarFilters) => void
}

export function CarFiltersComponent({ filters, onFiltersChange }: CarFiltersProps) {
  const [open, setOpen] = useState(false)
  const makes = getUniqueMakes()
  const locations = getUniqueLocations()

  const handleReset = () => {
    onFiltersChange({})
  }

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Make</Label>
        <Select
          value={filters.make || ""}
          onValueChange={(value) => onFiltersChange({ ...filters, make: value || undefined })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All makes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All makes</SelectItem>
            {makes.map((make) => (
              <SelectItem key={make} value={make}>
                {make}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Location</Label>
        <Select
          value={filters.location || ""}
          onValueChange={(value) => onFiltersChange({ ...filters, location: value || undefined })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Transmission</Label>
        <Select
          value={filters.transmission || ""}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, transmission: (value as TransmissionType) || undefined })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Any transmission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any transmission</SelectItem>
            <SelectItem value="automatic">Automatic</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Minimum Seats</Label>
        <Select
          value={filters.minSeats?.toString() || ""}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, minSeats: value ? Number.parseInt(value) : undefined })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="2">2+</SelectItem>
            <SelectItem value="4">4+</SelectItem>
            <SelectItem value="5">5+</SelectItem>
            <SelectItem value="7">7+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Price Range (per day)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, minPrice: e.target.value ? Number.parseInt(e.target.value) : undefined })
            }
            className="w-24"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, maxPrice: e.target.value ? Number.parseInt(e.target.value) : undefined })
            }
            className="w-24"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Year Range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minYear || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, minYear: e.target.value ? Number.parseInt(e.target.value) : undefined })
            }
            className="w-24"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxYear || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, maxYear: e.target.value ? Number.parseInt(e.target.value) : undefined })
            }
            className="w-24"
          />
        </div>
      </div>

      <Button variant="outline" onClick={handleReset} className="w-full bg-transparent">
        <X className="mr-2 h-4 w-4" />
        Reset Filters
      </Button>
    </div>
  )

  return (
    <>
      {/* Mobile Filter Sheet */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full bg-transparent">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Cars</SheetTitle>
              <SheetDescription>Narrow down your search</SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar Filters */}
      <div className="hidden lg:block">
        <div className="sticky top-24 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filters</h3>
          </div>
          <FilterContent />
        </div>
      </div>
    </>
  )
}
