import { headers } from "next/headers";
import { BookingsQueryControls } from "@/components/bookings-query-controls";
import { PaginationLinks } from "@/components/pagination-links";
import { AdminBookingsClient } from "@/components/role-pages/bookings-client";
import { getBaseUrlFromHeaders, normalizeListQuery } from "@/lib/query";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminBookingsPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const { sp, page, pageSize } = normalizeListQuery(searchParams, {
    // allowlist only the booking-list keys we support
    allow: [
      "q",
      "status",
      "car_id",
      "user_id",
      "date_from",
      "date_to",
      "sort",
      "order",
      "page",
      "page_size",
    ],
    defaultSort: "created_at",
    defaultOrder: "desc",
  });

  const h = await headers();
  const cookie = h.get("cookie") ?? "";

  const url = `${getBaseUrlFromHeaders(h)}/api/bookings?${sp.toString()}`;

  const res = await fetch(url, { cache: "no-store", headers: { cookie } });
  const json = (await res.json()) as any;

  const supabase = await createClient();
  const { data: cars } = await supabase
    .from("cars")
    .select("car_id, make, model")
    .order("make");

  const items = json?.items ?? [];
  const meta = json?.meta ?? { total: items.length, page, pageSize, totalPages: 1 };

  const total = meta.total ?? items.length;
  const pageFromMeta = meta.page ?? page;
  const pageSizeFromMeta = meta.pageSize ?? pageSize;
  const totalPages = meta.totalPages ?? Math.max(1, Math.ceil((total || 0) / Math.max(1, pageSizeFromMeta || 10)));

  return (
    <div className="container px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bookings</h1>
        <p className="text-muted-foreground">
          Search, filter, sort, and paginate via URL — shareable and reload-safe.
        </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <a href={`/api/export/bookings?${sp.toString()}&format=csv`}>Export CSV</a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/api/export/bookings?${sp.toString()}&format=xlsx`}>Export Excel</a>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <BookingsQueryControls resultsCount={total ?? items.length} />
      </div>

      <AdminBookingsClient initialBookings={items || []} cars={cars || []} />

      <PaginationLinks
        page={pageFromMeta ?? 1}
        totalPages={totalPages}
        searchParams={searchParams}
        pathname="/admin/bookings"
      />
    </div>
  );
}
