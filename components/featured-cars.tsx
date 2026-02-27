"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CarCard } from "@/components/car-card";
import { ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { useCarsStore } from "@/lib/store";
import { motion } from "framer-motion";

export function FeaturedCars() {
  const { cars, fetchCars } = useCarsStore();

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const featuredCars = cars
    .filter((car) => car.status === "active")
    .slice(0, 4);

  return (
    <section className="py-20 bg-muted/20">
      <div className="container px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h2 className="text-4xl font-bold mb-2 tracking-tight">
              Featured Vehicles
            </h2>
            <p className="text-muted-foreground">
              Explore our most popular rental choices
            </p>
          </div>

          <Button
            variant="outline"
            asChild
            className="hidden sm:flex border-primary/30 hover:border-primary"
          >
            <Link href="/cars">
              View All
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Car Grid */}
        <div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          
        >
          {featuredCars.map((car, index) => (
            <motion.div
              key={car.carId || index}
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 120 }}
              className="hover:shadow-lg transition-shadow rounded-xl"
            >
              <CarCard car={car} />
            </motion.div>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center sm:hidden">
          <Button asChild>
            <Link href="/cars">View All Cars</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
