"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useQueryPatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function patch(patch: Record<string, string | undefined | null>) {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    // Reset page when changing anything other than page
    if (Object.keys(patch).some((k) => k !== "page")) next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return { patch, pathname, sp, router };
}
