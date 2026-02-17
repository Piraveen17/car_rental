import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
  pathname?: string;
};

function buildQuery(
  base: Record<string, string | string[] | undefined>,
  patch: Record<string, string | undefined>
) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
    else sp.set(k, v);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (!v || v === "1") sp.delete(k);
    else sp.set(k, v);
  }
  return sp.toString();
}

export function PaginationLinks({ page, totalPages, searchParams, pathname = "/cars" }: Props) {
  if (totalPages <= 1) return null;

  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);

  // Keep it simple: show up to 7 page buttons
  const windowSize = 7;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const pages = [] as number[];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
      <Link
        className={`px-3 py-2 rounded-md border text-sm ${page === 1 ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}
        href={`${pathname}${buildQuery(searchParams, { page: String(prev) }) ? `?${buildQuery(searchParams, { page: String(prev) })}` : ""}`}
      >
        Prev
      </Link>

      {pages.map((p) => {
        const qs = buildQuery(searchParams, { page: String(p) });
        const href = qs ? `${pathname}?${qs}` : pathname;
        const active = p === page;
        return (
          <Link
            key={p}
            href={href}
            className={`px-3 py-2 rounded-md border text-sm ${active ? "bg-accent font-medium" : "hover:bg-accent"}`}
            aria-current={active ? "page" : undefined}
          >
            {p}
          </Link>
        );
      })}

      <Link
        className={`px-3 py-2 rounded-md border text-sm ${page === totalPages ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}
        href={`${pathname}${buildQuery(searchParams, { page: String(next) }) ? `?${buildQuery(searchParams, { page: String(next) })}` : ""}`}
      >
        Next
      </Link>
    </nav>
  );
}
