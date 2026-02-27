"use client";

import { ListQueryControls } from "@/components/list-query-controls";

type Option = { value: string; label: string };

type Props = {
  resultsCount: number;
  placeholder?: string;
  statusOptions?: Option[];
  sortOptions?: Option[];
};

export function SimpleQueryControls({
  resultsCount,
  placeholder = "Search…",
  statusOptions,
  sortOptions,
}: Props) {
  return (
    <ListQueryControls
      resultsCount={resultsCount}
      search={{ placeholder }}
      filters={
        statusOptions
          ? [
              {
                key: "status",
                label: "Status",
                options: [{ value: "all", label: "All" }, ...statusOptions],
              },
            ]
          : []
      }
      sort={
        sortOptions
          ? {
              options: sortOptions.map((o) => ({ value: o.value, label: o.label })),
            }
          : undefined
      }
    />
  );
}
