import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CarCard } from "@/components/car-card";
import { CarFiltersComponent } from "@/components/car-filters";
import { CarsQueryControls } from "@/components/cars-query-controls";
import { PaginationLinks } from "@/components/pagination-links";
import type { ICar } from "@/types";
import { headers } from "next/headers";
import { getBaseUrlFromHeaders, normalizeListQuery } from "@/lib/query";
import { Skeleton } from "@/components/ui/skeleton";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const { sp, page, pageSize } = normalizeListQuery(resolvedParams, {
    allow: [
      "q", "brand", "make", "type", "location", "transmission",
      "fuel_type", "price_min", "price_max", "year_min", "year_max",
      "seats", "sort", "order", "page", "page_size",
    ],
    defaultPageSize: 12,
    defaultSort: "created_at",
    defaultOrder: "desc",
  });

  const baseUrl = getBaseUrlFromHeaders(await headers());

  // Fetch cars + filter options in parallel
  const [carsRes, filtersRes] = await Promise.all([
    fetch(`${baseUrl}/api/cars?${sp.toString()}`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/cars/filters`, { next: { revalidate: 300 } }),
  ]);

  const json = await carsRes.json().catch(() => ({ items: [], meta: {} }));
  const filtersJson = await filtersRes.json().catch(() => ({}));

  const items = Array.isArray(json) ? json : (json.items ?? []);
  const meta = Array.isArray(json)
    ? { total: items.length, page, pageSize, totalPages: 1 }
    : (json.meta ?? { total: 0, page, pageSize, totalPages: 1 });

  const cars = items as ICar[];

  const makes: string[] = filtersJson.makes ?? Array.from(new Set(cars.map((c) => c.make).filter(Boolean)));
  const locations: string[] = filtersJson.locations ?? Array.from(new Set(cars.map((c) => c.location).filter(Boolean)));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="container px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Browse Our Fleet</h1>
            <p className="text-muted-foreground">
              Find the perfect car for your next journey.
            </p>
          </div>

          {/* Search + sort controls — needs Suspense for useSearchParams */}
          <div className="mb-6">
            <Suspense fallback={<Skeleton className="h-10 w-full" />}>
              <CarsQueryControls resultsCount={meta.total ?? cars.length} />
            </Suspense>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-8">
            {/* Filter sidebar — needs Suspense for useSearchParams */}
            <Suspense
              fallback={
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              }
            >
              <CarFiltersComponent makes={makes} locations={locations} />
            </Suspense>

            {/* Car Grid */}
            <div>
              {cars.length === 0 ? (
                <div className="text-center py-20 border rounded-xl bg-muted/20">
                  <div className="text-5xl mb-4">🚗</div>
                  <h3 className="text-xl font-semibold mb-2">No cars match your criteria</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {cars.map((car: any) => (
                    <CarCard key={car.carId ?? car.id ?? car.car_id} car={car} />
                  ))}
                </div>
              )}

              <Suspense fallback={null}>
                <PaginationLinks
                  page={meta.page ?? 1}
                  totalPages={meta.totalPages ?? 1}
                  searchParams={resolvedParams}
                  pathname="/cars"
                />
              </Suspense>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
