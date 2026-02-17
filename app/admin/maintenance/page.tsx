import { headers } from "next/headers";
import { MaintenanceQueryControls } from "@/components/maintenance-query-controls";
import { PaginationLinks } from "@/components/pagination-links";
import { AdminMaintenanceClient } from "@/components/role-pages/maintenance-client";

import { getBaseUrlFromHeaders, normalizeListQuery } from "@/lib/query";
import { Button } from "@/components/ui/button";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminMaintenancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { sp, page, pageSize } = normalizeListQuery(searchParams, {
    allow: ["q", "status", "car_id", "sort", "order", "page", "page_size"],
    defaultSort: "date",
    defaultOrder: "desc",
  });

  const h = await headers();
  const cookie = h.get("cookie") ?? "";

  const base = getBaseUrlFromHeaders(h);
  const maintenanceUrl = `${base}/api/maintenance?${sp.toString()}`;
  const maintenanceRes = await fetch(maintenanceUrl, {
    cache: "no-store",
    headers: { cookie },
  });
  const maintenanceJson = (await maintenanceRes.json()) as any;

  const items = maintenanceJson?.items ?? [];
  const meta = maintenanceJson?.meta ?? { total: items.length, page, pageSize, totalPages: 1 };
  const total = meta.total ?? items.length;
  const pageFromMeta = meta.page ?? page;
  const pageSizeFromMeta = meta.pageSize ?? pageSize;
  const totalPages = meta.totalPages ?? Math.max(1, Math.ceil((total || 0) / Math.max(1, pageSizeFromMeta || 10)));

  // Cars list for dropdowns (best-effort)
  const carsRes = await fetch(`${base}/api/cars?page=1&page_size=500`, {
    cache: "no-store",
    headers: { cookie },
  });
  const carsJson = (await carsRes.json()) as any;
  const cars = carsJson?.items ?? [];

  return (
    <div className="container px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Maintenance</h1>
          <p className="text-muted-foreground">
            Search, filter, sort, and paginate via URL — shareable and reload-safe.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <a href={`/api/export/maintenance?${sp.toString()}&format=csv`}>Export CSV</a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/api/export/maintenance?${sp.toString()}&format=xlsx`}>Export Excel</a>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <MaintenanceQueryControls resultsCount={total ?? items.length} />
      </div>

      <AdminMaintenanceClient initialRecords={items || []} cars={cars || []} />

      <PaginationLinks
        page={pageFromMeta ?? 1}
        totalPages={totalPages}
        searchParams={searchParams}
        pathname="/admin/maintenance"
      />
    </div>
  );
}
