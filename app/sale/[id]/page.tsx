"use client"

import { useEffect, useState, use } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
// import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner" 

export default function SaleCarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [car, setCar] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" })
  const [sending, setSending] = useState(false)
  


  useEffect(() => {
    fetchCar()
  }, [])

  const fetchCar = async () => {
    try {
      const res = await fetch(`/api/sales/${id}`)
      if (!res.ok) throw new Error("Car not found")
      const data = await res.json()
      setCar(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault()
     setSending(true)
     
     // LEADS are usually stored in a Leads table. 
     // We should probably create app/api/leads/route.ts
     // For now, let's mock the lead submission or create that endpoint quickly.
     // Assuming /api/leads exists or we inline it.
     // Let's assume we need to create /api/leads for this.
     
     try {
       const res = await fetch("/api/leads", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            saleCarId: car.id,
            name: form.name,
            email: form.email,
            phone: form.phone,
            message: form.message
         })
       })

       if (!res.ok) throw new Error("Failed to send inquiry")

       alert("Inquiry sent successfully! We will contact you soon.")
       setForm({ name: "", email: "", phone: "", message: "" })
     } catch (error: any) {
         alert("Failed to send inquiry: " + error.message)
     } finally {
         setSending(false)
     }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!car) return <div className="p-8 text-center">Car not found</div>

  return (
    <div className="min-h-screen flex flex-col">
       <Navbar />
       <main className="flex-1 container py-8">
          <div className="grid md:grid-cols-2 gap-8">
             {/* Images */}
             <div className="space-y-4">
                <div className="relative h-96 w-full rounded-xl overflow-hidden bg-muted">
                    {car.images?.[0] ? (
                        <Image src={car.images[0]} alt={car.model} fill className="object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center">No Image</div>
                    )}
                </div>
                {/* Thumbnails if any */}
             </div>

             {/* Details & Form */}
             <div>
                <div className="mb-6">
                   <h1 className="text-4xl font-bold mb-2">{car.make} {car.model}</h1>
                   <div className="flex gap-4 items-center mb-4">
                      <Badge variant="secondary">{car.year}</Badge>
                      <span className="text-muted-foreground">{car.mileage?.toLocaleString()} km</span>
                      <span className="text-muted-foreground">{car.location}</span>
                   </div>
                   <p className="text-3xl font-bold text-primary mb-6">${car.price?.toLocaleString()}</p>
                   
                   <div className="prose max-w-none text-muted-foreground mb-8">
                      {car.description}
                   </div>
                   
                   {/* Features */}
                   {car.features && (
                       <div className="flex flex-wrap gap-2 mb-8">
                          {car.features.map((f: string) => (
                              <Badge key={f} variant="outline">{f}</Badge>
                          ))}
                       </div>
                   )}
                </div>

                {/* Inquiry Form */}
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                   <h3 className="text-xl font-semibold mb-4">Interested? Send an Inquiry</h3>
                   <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label>Name</Label>
                            <Input 
                               required 
                               value={form.name} 
                               onChange={e => setForm({...form, name: e.target.value})} 
                            />
                         </div>
                         <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input 
                               value={form.phone} 
                               onChange={e => setForm({...form, phone: e.target.value})} 
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <Label>Email</Label>
                         <Input 
                            type="email" 
                            required 
                            value={form.email} 
                            onChange={e => setForm({...form, email: e.target.value})} 
                         />
                      </div>
                      <div className="space-y-2">
                         <Label>Message</Label>
                         <Textarea 
                            placeholder="I'm interested in this car..."
                            value={form.message} 
                            onChange={e => setForm({...form, message: e.target.value})} 
                         />
                      </div>
                      <Button type="submit" className="w-full" disabled={sending}>
                         {sending ? "Sending..." : "Send Inquiry"}
                      </Button>
                   </form>
                </div>
             </div>
          </div>
       </main>
       <Footer />
    </div>
  )
}
