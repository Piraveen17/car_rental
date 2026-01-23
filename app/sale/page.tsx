"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
// import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SaleCarsPage() {
  const [cars, setCars] = useState<any[]>([])
  const [search, setSearch] = useState("")
  // const supabase = createClient()

  useEffect(() => {
    fetchCars()
  }, [])

  const fetchCars = async () => {
    try {
      const res = await fetch("/api/sales?status=available")
      if (res.ok) {
        const data = await res.json()
        setCars(data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const filteredCars = cars.filter(c => 
     c.make.toLowerCase().includes(search.toLowerCase()) || 
     c.model.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen flex flex-col">
       <Navbar />
       <main className="flex-1 container py-8">
          <div className="flex justify-between items-center mb-8">
             <div>
                <h1 className="text-3xl font-bold">Cars for Sale</h1>
                <p className="text-muted-foreground">Premium used cars at unbeatable prices.</p>
             </div>
             <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                   placeholder="Search cars..." 
                   className="pl-8" 
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                />
             </div>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
             {filteredCars.map(car => (
                <Card key={car.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                   <div className="relative h-48 w-full bg-muted">
                      {car.images?.[0] ? (
                         <Image src={car.images[0]} alt={car.model} fill className="object-cover" />
                      ) : (
                         <div className="flex h-full items-center justify-center text-muted-foreground">No Image</div>
                      )}
                      <Badge className="absolute top-2 right-2">{car.year}</Badge>
                   </div>
                   <CardContent className="p-4">
                      <h3 className="font-bold text-lg">{car.make} {car.model}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{car.mileage?.toLocaleString()} km</p>
                      <p className="text-xl font-bold text-primary">${car.price?.toLocaleString()}</p>
                   </CardContent>
                   <CardFooter className="p-4 pt-0">
                      <Button asChild className="w-full">
                         <Link href={`/sale/${car.id}`}>View Details</Link>
                      </Button>
                   </CardFooter>
                </Card>
             ))}
          </div>
       </main>
       <Footer />
    </div>
  )
}
