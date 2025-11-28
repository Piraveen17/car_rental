"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Star, Loader2, ChevronRight, Lightbulb } from "lucide-react"
import { cars } from "@/lib/data"
import { useAuthStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface Recommendation {
  carId: string
  score: number
  reasons: string[]
  bestFor: string
}

interface AIRecommendationsProps {
  className?: string
}

export function AIRecommendations({ className }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [personalizedTip, setPersonalizedTip] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const { user } = useAuthStore()

  const fetchRecommendations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ai-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "guest",
          preferences: {},
        }),
      })

      const data = await response.json()
      setRecommendations(data.recommendations)
      setPersonalizedTip(data.personalizedTip)
      setHasLoaded(true)
    } catch (error) {
      console.error("Failed to fetch recommendations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!hasLoaded) {
      fetchRecommendations()
    }
  }, [user?.id])

  if (isLoading) {
    return (
      <Card className={cn("border-primary/20", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">AI is analyzing your preferences...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <Card className={cn("border-primary/20 overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-500/10 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">AI Recommendations</CardTitle>
            <p className="text-xs text-muted-foreground">Personalized picks just for you</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Personalized Tip */}
        {personalizedTip && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">{personalizedTip}</p>
          </div>
        )}

        {/* Recommendations */}
        <div className="space-y-3">
          {recommendations.map((rec, index) => {
            const car = cars.find((c) => c.id === rec.carId)
            if (!car) return null

            return (
              <div key={rec.carId} className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="relative h-20 w-28 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={car.images[0] || "/placeholder.svg?height=80&width=112&query=car"}
                    alt={`${car.make} ${car.model}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-1 left-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      #{index + 1}
                    </Badge>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-sm truncate">
                        {car.year} {car.make} {car.model}
                      </h4>
                      <p className="text-xs text-muted-foreground">{rec.bestFor}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-medium">{rec.score}%</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {rec.reasons.slice(0, 2).map((reason, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-semibold text-primary">${car.pricePerDay}/day</span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                      <Link href={`/cars/${car.id}`}>
                        View
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <Button variant="outline" className="w-full bg-transparent" onClick={fetchRecommendations}>
          <Sparkles className="mr-2 h-4 w-4" />
          Refresh Recommendations
        </Button>
      </CardContent>
    </Card>
  )
}
