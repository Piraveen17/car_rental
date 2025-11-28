"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AISearchBarProps {
  onResults?: (carIds: string[], explanation: string) => void
  className?: string
}

export function AISearchBar({ onResults, className }: AISearchBarProps) {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [explanation, setExplanation] = useState("")
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsSearching(true)
    setExplanation("")

    try {
      const response = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      const data = await response.json()

      if (onResults) {
        onResults(data.matchingCarIds, data.explanation)
      }
      setExplanation(data.explanation)
    } catch (error) {
      console.error("AI search failed:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const exampleQueries = [
    "Family car for 5 people",
    "Luxury SUV in LA",
    "Cheap automatic under $70",
    "Electric car in San Francisco",
  ]

  return (
    <div className={cn("space-y-3", className)}>
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe your ideal car... (e.g., 'spacious SUV for a family trip')"
              className="pl-10 pr-4 h-12 text-base"
              disabled={isSearching}
            />
          </div>
          <Button type="submit" disabled={isSearching || !query.trim()} className="h-12 px-6">
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                AI Search
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Example queries */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground">Try:</span>
        {exampleQueries.map((example, index) => (
          <button
            key={index}
            onClick={() => setQuery(example)}
            className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {example}
          </button>
        ))}
      </div>

      {/* AI Explanation */}
      {explanation && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">{explanation}</p>
          </div>
        </div>
      )}
    </div>
  )
}
