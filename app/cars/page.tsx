import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CarCard } from "@/components/car-card";
import { CarFiltersComponent } from "@/components/car-filters";
import { CarsQueryControls } from "@/components/cars-query-controls";
import { PaginationLinks } from "@/components/pagination-links";
import type { ICar } from "@/types";
import { headers } from "next/headers";
import { getBaseUrlFromHeaders, normalizeListQuery } from "@/lib/query";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;

  const { sp, page, pageSize } = normalizeListQuery(resolvedSearchParams, {
    allow: [
      "q",
      "brand",
      "make",
      "type",
      "location",
      "transmission",
      "fuel_type",
      "price_min",
      "price_max",
      "year_min",
      "year_max",
      "seats",
      "sort",
      "order",
      "page",
      "page_size",
    ],
    defaultPageSize: 12,
    defaultSort: "created_at",
    defaultOrder: "desc",
  });

  // ✅ unwrap headers
  const h = await headers();
  const baseUrl = getBaseUrlFromHeaders(h);

  const url = `${baseUrl}/api/cars?${sp.toString()}`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  const json = await res.json();

  const items = Array.isArray(json) ? json : json.items;
  const meta = Array.isArray(json)
    ? { total: items.length, page, pageSize, totalPages: 1 }
    : json.meta;

  const cars = (items || []) as ICar[];

  const makes = Array.from(new Set(cars.map((c) => c.make).filter(Boolean)));
  const locations = Array.from(
    new Set(cars.map((c) => c.location).filter(Boolean))
  );

  const types = Array.from(
    new Set(
      cars
        .flatMap((c: any) => (Array.isArray(c.features) ? c.features : []))
        .map((t: any) => String(t))
        .filter(Boolean)
    )
  ).slice(0, 30);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="container px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Browse Our Fleet</h1>
            <p className="text-muted-foreground">
              Search, filter, sort, and paginate via URL — shareable and
              SEO-friendly.
            </p>
          </div>

          {/* Search + sort (URL-driven) */}
          <div className="mb-6">
            <CarsQueryControls resultsCount={meta.total ?? cars.length} />
          </div>

          <div className="grid lg:grid-cols-[300px_1fr] gap-8">
            {/* Filters (URL-driven) */}
            <aside>
              <div className="space-y-6 sticky top-20">
                <CarFiltersComponent
                  makes={makes}
                  locations={locations}
                  types={types}
                />
              </div>
            </aside>

            {/* Car Grid */}
            <div>
              {cars.length === 0 ? (
                <div className="text-center py-20">
                  <h3 className="text-xl font-semibold mb-2">
                    No cars match your criteria
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting filters or search terms.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {cars.map((car: any) => (
                    <CarCard
                      key={car.carId ?? car.id ?? car.car_id}
                      car={car}
                    />
                  ))}
                </div>
              )}

              <PaginationLinks
                page={meta.page ?? 1}
                totalPages={meta.totalPages ?? 1}
                searchParams={searchParams}
                pathname="/cars"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
