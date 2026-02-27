"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Car as CarIcon, Users, Settings2, Fuel, MapPin, Check, ChevronLeft, ChevronRight } from "lucide-react"
import type { ICar } from "@/types"

interface CarQuickViewProps {
  car: ICar
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CarQuickView({ car, open, onOpenChange }: CarQuickViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const prevImage = () => setCurrentImageIndex((i) => (i === 0 ? car.images.length - 1 : i - 1))
  const nextImage = () => setCurrentImageIndex((i) => (i === car.images.length - 1 ? 0 : i + 1))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CarIcon className="h-5 w-5" />
            {car.make} {car.model} ({car.year})
          </DialogTitle>
          <DialogDescription>
            Quick view — {car.location} · ${car.pricePerDay}/day
          </DialogDescription>
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
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {car.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Seats</p>
                <p className="font-medium">{car.seats}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Settings2 className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Transmission</p>
                <p className="font-medium capitalize">{car.transmission}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Fuel className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Fuel</p>
                <p className="font-medium">{car.fuelType}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Location</p>
                <p className="font-medium">{car.location}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          {car.description && (
            <p className="text-sm text-muted-foreground">{car.description}</p>
          )}

          {/* Features */}
          {car.features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {car.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {feature}
                </Badge>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-3 pt-2">
            <Button asChild className="flex-1">
              <Link href={`/cars/${car.carId}`}>
                View Full Details & Book
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
