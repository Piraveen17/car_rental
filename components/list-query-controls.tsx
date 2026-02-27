"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useQueryPatcher } from "@/components/query-helpers";

export type ListSelectOption = { value: string; label: string };

export type ListFilterConfig = {
  key: string;
  label: string;
  widthClassName?: string;
  defaultValue?: string; // e.g. "all"
  options: ListSelectOption[];
};

export type ListSortOption = { value: string; label: string };

type Props = {
  resultsCount: number;
  search?: {
    key?: string; // default "q"
    placeholder: string;
    debounceMs?: number;
  };
  filters?: ListFilterConfig[];
  sort?: {
    sortKey?: string; // default "sort"
    orderKey?: string; // default "order"
    options: ListSortOption[];
    widthClassName?: string;
  };
};

/**
 * Generic URL-query driven list controls.
 * Source of truth = URL. No local filtering.
 */
export function ListQueryControls({ resultsCount, search, filters, sort }: Props) {
  const { patch, sp } = useQueryPatcher();

  const qKey = search?.key ?? "q";
  const q = sp.get(qKey) || "";

  // typing UX; source of truth remains URL
  const [draft, setDraft] = useState(q);
  useEffect(() => setDraft(q), [q]);

  useEffect(() => {
    if (!search) return;
    const t = setTimeout(() => {
      if (draft !== q) patch({ [qKey]: draft });
    }, search.debounceMs ?? 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const sortKey = sort?.sortKey ?? "sort";
  const orderKey = sort?.orderKey ?? "order";
  const sortVal = sp.get(sortKey) || "created_at";
  const orderVal = (sp.get(orderKey) || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {search ? (
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={search.placeholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="pl-10"
          />
        </div>
      ) : (
        <div />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{resultsCount}</span> result
          {resultsCount !== 1 ? "s" : ""}
        </div>

        {(filters ?? []).map((f) => {
          const current = sp.get(f.key) || f.defaultValue || "all";
          return (
            <Select
              key={f.key}
              value={current}
              onValueChange={(v) =>
                patch({
                  [f.key]: v === (f.defaultValue || "all") ? "" : v,
                })
              }
            >
              <SelectTrigger className={f.widthClassName ?? "w-[200px]"}>
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}

        {sort ? (
          <Select
            value={`${sortVal}:${orderVal}`}
            onValueChange={(value) => {
              const [s, o] = value.split(":");
              patch({ [sortKey]: s, [orderKey]: o });
            }}
          >
            <SelectTrigger className={sort.widthClassName ?? "w-[190px]"}>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {sort.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
    </div>
  );
}
