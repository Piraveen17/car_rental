import { headers } from "next/headers";
import { PaginationLinks } from "@/components/pagination-links";
import { NotificationsPageClient } from "@/components/notifications-page-client";
import { getBaseUrlFromHeaders, normalizeListQuery, type SearchParams } from "@/lib/query";

export default async function NotificationsPage({ searchParams }: { searchParams: SearchParams }) {
  const { sp, page, pageSize } = normalizeListQuery(searchParams, {
    allow: ["q", "unread", "sort", "order", "page", "page_size"],
    defaultSort: "created_at",
    defaultOrder: "desc",
    defaultPageSize: 10,
  });

  const h = await headers();
  const cookie = h.get("cookie") ?? "";
  const base = getBaseUrlFromHeaders(h);
  const url = `${base}/api/notifications?${sp.toString()}`;
  const res = await fetch(url, { cache: "no-store", headers: { cookie } });
  const json = (await res.json()) as any;

  const items = json?.items ?? [];
  const meta = json?.meta ?? { total: items.length, page, pageSize, totalPages: 1 };

  return (
    <div className="container px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Notifications</h1>
        <p className="text-muted-foreground">Reload-safe & shareable via URL query params.</p>
      </div>

      <NotificationsPageClient initialItems={items} />

      <div className="mt-6">
        <PaginationLinks
          page={meta.page ?? page}
          totalPages={meta.totalPages ?? 1}
          searchParams={searchParams}
          pathname="/dashboard/notifications"
        />
      </div>
    </div>
  );
}
