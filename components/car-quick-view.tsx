"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import type { Car } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Users, Fuel, Settings2, MapPin, Calendar, Check, ChevronLeft, ChevronRight, CarIcon } from "lucide-react"

interface CarQuickViewProps {
  car: Car
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CarQuickView({ car, open, onOpenChange }: CarQuickViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? car.images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === car.images.length - 1 ? 0 : prev + 1))
  }

  const statusColors = {
    active: "bg-green-500/10 text-green-600 border-green-500/20",
    inactive: "bg-muted text-muted-foreground",
    maintenance: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CarIcon className="h-5 w-5" />
            {car.make} {car.model} ({car.year})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Gallery */}
          <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted">
            <Image
              src={car.images[currentImageIndex] || "/placeholder.svg?height=400&width=700&query=car"}
              alt={`${car.make} ${car.model}`}
              fill
              className="object-cover"
            />
            {car.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
            <Badge className={`absolute top-3 right-3 ${statusColors[car.status]}`}>{car.status}</Badge>
          </div>

          {/* Thumbnails */}
          {car.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {car.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative w-16 h-12 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    currentImageIndex === index ? "border-primary" : "border-transparent hover:border-muted-foreground"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${car.make} ${car.model} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Price and Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-primary">${car.pricePerDay}</p>
              <p className="text-sm text-muted-foreground">per day</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">License Plate</p>
              <p className="font-mono font-semibold">{car.licensePlate}</p>
            </div>
          </div>

          <Separator />

          {/* Specifications */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Seats</p>
                <p className="font-semibold">{car.seats}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Settings2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Transmission</p>
                <p className="font-semibold capitalize">{car.transmission}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Fuel className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Fuel Type</p>
                <p className="font-semibold">{car.fuelType}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-semibold">{car.location}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {car.description && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground text-sm">{car.description}</p>
              </div>
            </>
          )}

          {/* Features */}
          <div>
            <h4 className="font-semibold mb-3">Features</h4>
            <div className="flex flex-wrap gap-2">
              {car.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button asChild className="flex-1" disabled={car.status !== "active"}>
              <Link href={`/cars/${car.id}`}>
                <Calendar className="mr-2 h-4 w-4" />
                {car.status === "active" ? "Book Now" : "Unavailable"}
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
