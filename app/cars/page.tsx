"use client"

import { useState, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CarCard } from "@/components/car-card"
import { CarFiltersComponent } from "@/components/car-filters"
import { useCarsStore } from "@/lib/store"
import type { CarFilters } from "@/types"
import { Input } from "@/components/ui/input"
import { Search, Sparkles } from "lucide-react"
import { AISearchBar } from "@/components/ai-search-bar"
import { AIRecommendations } from "@/components/ai-recommendations"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CarsPage() {
  const { cars } = useCarsStore()
  const [filters, setFilters] = useState<CarFilters>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [aiFilteredIds, setAiFilteredIds] = useState<string[] | null>(null)
  const [aiExplanation, setAiExplanation] = useState("")

  const filteredCars = useMemo(() => {
    let carsToFilter = cars

    if (aiFilteredIds && aiFilteredIds.length > 0) {
      carsToFilter = cars.filter((car) => aiFilteredIds.includes(car.id))
    }

    return carsToFilter.filter((car) => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          car.make.toLowerCase().includes(query) ||
          car.model.toLowerCase().includes(query) ||
          car.location.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Make filter
      if (filters.make && filters.make !== "all" && car.make !== filters.make) return false

      // Location filter
      if (filters.location && filters.location !== "all" && car.location !== filters.location) return false

      // Transmission filter
      if (filters.transmission && filters.transmission !== "all" && car.transmission !== filters.transmission)
        return false

      // Seats filter
      if (filters.minSeats && car.seats < filters.minSeats) return false

      // Price filter
      if (filters.minPrice && car.pricePerDay < filters.minPrice) return false
      if (filters.maxPrice && car.pricePerDay > filters.maxPrice) return false

      // Year filter
      if (filters.minYear && car.year < filters.minYear) return false
      if (filters.maxYear && car.year > filters.maxYear) return false

      // Only show active cars to customers
      if (car.status !== "active") return false

      return true
    })
  }, [cars, filters, searchQuery, aiFilteredIds])

  const handleAISearchResults = (carIds: string[], explanation: string) => {
    setAiFilteredIds(carIds)
    setAiExplanation(explanation)
  }

  const clearAIFilter = () => {
    setAiFilteredIds(null)
    setAiExplanation("")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="container px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Browse Our Fleet</h1>
            <p className="text-muted-foreground">Find the perfect vehicle for your journey</p>
          </div>

          <div className="mb-6">
            <Tabs defaultValue="ai" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="ai" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Search
                </TabsTrigger>
                <TabsTrigger value="traditional" className="gap-2">
                  <Search className="h-4 w-4" />
                  Traditional Search
                </TabsTrigger>
              </TabsList>
              <TabsContent value="ai">
                <AISearchBar onResults={handleAISearchResults} />
                {aiFilteredIds && (
                  <button onClick={clearAIFilter} className="mt-2 text-sm text-primary hover:underline">
                    Clear AI filter and show all cars
                  </button>
                )}
              </TabsContent>
              <TabsContent value="traditional">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by make, model, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-8">
            {/* Filters */}
            <aside className="space-y-6">
              <CarFiltersComponent filters={filters} onFiltersChange={setFilters} />
              <AIRecommendations />
            </aside>

            {/* Car Grid */}
            <div>
              {filteredCars.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">No cars found matching your criteria.</p>
                  <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or use AI search.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {filteredCars.length} car{filteredCars.length !== 1 ? "s" : ""} found
                    {aiFilteredIds && " (AI filtered)"}
                  </p>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCars.map((car) => (
                      <CarCard key={car.id} car={car} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
