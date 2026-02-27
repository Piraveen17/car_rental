import { headers } from "next/headers";
import { UsersQueryControls } from "@/components/users-query-controls";
import { PaginationLinks } from "@/components/pagination-links";
import { AdminUsersClient } from "@/components/role-pages/users-client";
import { getBaseUrlFromHeaders, normalizeListQuery } from "@/lib/query";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { sp, page, pageSize } = normalizeListQuery(searchParams, {
    allow: ["q", "role", "sort", "order", "page", "page_size"],
    defaultSort: "created_at",
    defaultOrder: "desc",
  });

  const h = headers();
  const cookie = h.get("cookie") ?? "";

  const url = `${getBaseUrlFromHeaders(headers())}/api/users?${sp.toString()}`;
  const res = await fetch(url, { cache: "no-store", headers: { cookie } });
  const json = (await res.json()) as any;

  const items = json?.items ?? [];
  const meta = json?.meta ?? { total: items.length, page, pageSize, totalPages: 1 };
  const total = meta.total ?? items.length;
  const pageFromMeta = meta.page ?? page;
  const pageSizeFromMeta = meta.pageSize ?? pageSize;
  const totalPages = meta.totalPages ?? Math.max(1, Math.ceil((total || 0) / Math.max(1, pageSizeFromMeta || 10)));

  return (
    <div className="container px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Search, filter, sort, and paginate via URL — shareable and reload-safe.
        </p>
      </div>

      <div className="mb-6">
        <UsersQueryControls resultsCount={total ?? items.length} />
      </div>

      <AdminUsersClient initialUsers={items || []} />

      <PaginationLinks
        page={pageFromMeta ?? 1}
        totalPages={totalPages}
        searchParams={searchParams}
        pathname="/admin/users"
      />
    </div>
  );
}
