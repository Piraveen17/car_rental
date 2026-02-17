/**
 * Shared query utilities to keep all list pages + list APIs consistent.
 *
 * Goals:
 * - URL is the source of truth (shareable + reload-safe)
 * - consistent defaults (page, page_size)
 * - allowlist support (security + maintainability)
 */

export type SearchParams = Record<string, string | string[] | undefined>;

export type ListQueryOptions = {
  /** Which query keys are allowed to pass through (others are dropped). */
  allow?: string[];
  /** Default page size if not provided. */
  defaultPageSize?: number;
  /** Min/Max clamp for page size. */
  minPageSize?: number;
  maxPageSize?: number;
  /** Default sort + order. */
  defaultSort?: string;
  defaultOrder?: "asc" | "desc";
};

export type NormalizedListQuery = {
  sp: URLSearchParams;
  page: number;
  pageSize: number;
  sort?: string;
  order?: "asc" | "desc";
};

function clampInt(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function readInt(value: string | null | undefined, fallback: number) {
  if (value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Convert Next.js `searchParams` object into URLSearchParams (optionally allowlisted). */
export function toURLSearchParams(searchParams: SearchParams, allow?: string[]) {
  const sp = new URLSearchParams();
  const allowSet = allow?.length ? new Set(allow) : null;

  for (const [k, v] of Object.entries(searchParams || {})) {
    if (v === undefined) continue;
    if (allowSet && !allowSet.has(k)) continue;
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
    else sp.set(k, v);
  }

  return sp;
}

/** Normalize common list params: page + page_size (supports legacy `limit`). */
export function normalizeListQuery(searchParams: SearchParams, opts: ListQueryOptions = {}): NormalizedListQuery {
  const {
    allow,
    defaultPageSize = 10,
    minPageSize = 5,
    maxPageSize = 100,
    defaultSort,
    defaultOrder,
  } = opts;

  const sp = toURLSearchParams(searchParams, allow);

  // page
  const page = clampInt(readInt(sp.get("page"), 1), 1, 1_000_000);
  sp.set("page", String(page));

  // page_size (or legacy limit)
  const rawSize = sp.get("page_size") ?? sp.get("limit");
  const pageSize = clampInt(readInt(rawSize, defaultPageSize), minPageSize, maxPageSize);
  sp.set("page_size", String(pageSize));
  sp.delete("limit");

  // sort/order defaults (don’t force if not configured)
  const sort = sp.get("sort") ?? undefined;
  const order = (sp.get("order") as any) ?? undefined;

  if (!sort && defaultSort) sp.set("sort", defaultSort);
  if (!order && defaultOrder) sp.set("order", defaultOrder);

  return {
    sp,
    page,
    pageSize,
    sort: (sp.get("sort") ?? undefined) || undefined,
    order: (sp.get("order") as any) || undefined,
  };
}

/** Build absolute base URL from request headers (works behind proxies). */
export function getBaseUrlFromHeaders(h: Headers) {
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
