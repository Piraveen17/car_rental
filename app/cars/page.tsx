"use client";

import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CarCard } from "@/components/car-card";
import { CarFiltersComponent } from "@/components/car-filters";
import { useCarsStore } from "@/lib/store";
import type { CarFilters } from "@/types";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function CarsPage() {
  const { cars, fetchCars } = useCarsStore();
  const [filters, setFilters] = useState<CarFilters>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  // small animated counter for results
  const [animatedCount, setAnimatedCount] = useState(0);
  const filteredCars = useMemo(() => {
    let carsToFilter = cars;

    return carsToFilter.filter((car) => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          (car.make && car.make.toLowerCase().includes(query)) ||
          (car.model && car.model.toLowerCase().includes(query)) ||
          (car.location && car.location.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Make filter
      if (filters.make && filters.make !== "all" && car.make !== filters.make)
        return false;

      // Location filter
      if (
        filters.location &&
        filters.location !== "all" &&
        car.location !== filters.location
      )
        return false;

      // Transmission filter
      if (
        filters.transmission &&
        filters.transmission !== "all" &&
        car.transmission !== filters.transmission
      )
        return false;

      // Seats filter
      if (filters.minSeats && car.seats < filters.minSeats) return false;

      // Price filter
      if (filters.minPrice && car.pricePerDay < filters.minPrice)
        return false;
      if (filters.maxPrice && car.pricePerDay > filters.maxPrice)
        return false;

      // Year filter
      if (filters.minYear && car.year < filters.minYear) return false;
      if (filters.maxYear && car.year > filters.maxYear) return false;

      // Only show active cars to customers
      if (car.status !== "active") return false;

      return true;
    });
  }, [cars, filters, searchQuery]);

  // animate result count when filteredCars changes
  useEffect(() => {
    let raf: number | null = null;
    const start = animatedCount;
    const end = filteredCars.length;
    const duration = 400;
    const startTime = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // simple ease
      const value = Math.round(start + (end - start) * eased);
      setAnimatedCount(value);
      if (t < 1) raf = requestAnimationFrame(step);
      else raf = null;
    };

    raf = requestAnimationFrame(step);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCars.length]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="container px-4 py-8">
          <div className="mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="text-3xl font-bold mb-2"
            >
              Browse Our Fleet
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.45 }}
              className="text-muted-foreground"
            >
              Find the perfect vehicle for your journey
            </motion.p>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by make, model, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-[300px_1fr] gap-8">
            {/* Filters */}
            <aside>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45 }}
                className="space-y-6 sticky top-20"
              >
                <CarFiltersComponent
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </motion.div>
            </aside>

            {/* Car Grid */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45 }}
                  className="text-sm text-muted-foreground"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {animatedCount}
                  </span>{" "}
                  car{filteredCars.length !== 1 ? "s" : ""} found
                </motion.div>
              </div>

              {filteredCars.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="text-center py-20"
                >
                  <div className="mx-auto max-w-md">
                    <svg
                      className="mx-auto mb-6 w-32 h-32 opacity-60"
                      viewBox="0 0 80 80"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        width="80"
                        height="80"
                        rx="12"
                        fill="currentColor"
                        opacity="0.06"
                      />
                      <path
                        d="M20 50 L30 30 L40 50 L50 20"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        opacity="0.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <h3 className="text-xl font-semibold mb-2">
                      No cars match your criteria
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting filters, clearing the AI search, or broaden
                      your search terms.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Link
                        href="/cars"
                        className="btn inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        Clear Filters
                      </Link>
                      <button
                        onClick={() => {
                          setFilters({});
                          setSearchQuery("");
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  layout
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.06 } },
                  }}
                >
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence initial={false}>
                      {filteredCars.map((car) => {
                        const key = (car as any).id ?? (car as any).carId;
                        return (
                          <motion.div
                            key={key}
                            layout
                            initial={{ opacity: 0, y: 8, scale: 0.995 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.995 }}
                            whileHover={{ scale: 1.02 }}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 22,
                            }}
                          >
                            <CarCard car={car} />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
