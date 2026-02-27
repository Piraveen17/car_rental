"use client";

import { useMemo } from "react";
import { useQueryPatcher } from "@/components/query-helpers";
import { Button } from "@/components/ui/button";

type Props = {
  page: number;
  totalPages: number;
};

export function ClientPagination({ page, totalPages }: Props) {
  const { patch } = useQueryPatcher();
  if (!totalPages || totalPages <= 1) return null;

  const pages = useMemo(() => {
    const windowSize = 7;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const arr: number[] = [];
    for (let p = start; p <= end; p++) arr.push(p);
    return arr;
  }, [page, totalPages]);

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => patch({ page: String(Math.max(1, page - 1)) })}>
        Prev
      </Button>
      {pages.map((p) => (
        <Button
          key={p}
          variant={p === page ? "default" : "outline"}
          size="sm"
          onClick={() => patch({ page: String(p) })}
        >
          {p}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => patch({ page: String(Math.min(totalPages, page + 1)) })}
      >
        Next
      </Button>
    </div>
  );
}
