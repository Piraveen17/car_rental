"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Car } from "@/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CarQuickView } from "@/components/car-quick-view"
import { Users, Fuel, Settings2, MapPin, Eye } from "lucide-react"

interface CarCardProps {
  car: Car
}

export function CarCard({ car }: CarCardProps) {
  const [showQuickView, setShowQuickView] = useState(false)

  const statusColors = {
    active: "bg-green-500/10 text-green-600 border-green-500/20",
    inactive: "bg-muted text-muted-foreground",
    maintenance: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  }

  return (
    <>
      <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={car.images[0] || "/placeholder.svg?height=200&width=320&query=car"}
            alt={`${car.make} ${car.model}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <Badge className={`absolute top-3 right-3 ${statusColors[car.status]}`}>{car.status}</Badge>
          <button
            onClick={() => setShowQuickView(true)}
            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <div className="bg-background/90 rounded-full p-3 shadow-lg">
              <Eye className="h-5 w-5" />
            </div>
          </button>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg">
                {car.make} {car.model}
              </h3>
              <p className="text-sm text-muted-foreground">{car.year}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">${car.pricePerDay}</p>
              <p className="text-xs text-muted-foreground">per day</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{car.seats} seats</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings2 className="h-4 w-4" />
              <span className="capitalize">{car.transmission}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Fuel className="h-4 w-4" />
              <span>{car.fuelType}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{car.location}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 gap-2">
          <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => setShowQuickView(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Quick View
          </Button>
          <Button asChild size="sm" className="flex-1" disabled={car.status !== "active"}>
            <Link href={`/cars/${car.id}`}>{car.status === "active" ? "View Details" : "Unavailable"}</Link>
          </Button>
        </CardFooter>
      </Card>

      <CarQuickView car={car} open={showQuickView} onOpenChange={setShowQuickView} />
    </>
  )
}
