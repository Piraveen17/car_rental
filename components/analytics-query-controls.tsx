"use client";

import { useMemo } from "react";
import { useQueryPatcher } from "@/components/query-helpers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AnalyticsQueryControls() {
  const { patch, sp } = useQueryPatcher();
  const dateFrom = sp.get("date_from") || "";
  const dateTo = sp.get("date_to") || "";
  const months = sp.get("months") || "6";

  const monthOptions = useMemo(
    () => ["1", "3", "6", "12", "18", "24"],
    []
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>Date from</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => patch({ date_from: e.target.value, page: "1" })}
          />
        </div>
        <div className="space-y-1">
          <Label>Date to</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => patch({ date_to: e.target.value, page: "1" })}
          />
        </div>
        <div className="space-y-1">
          <Label>Months</Label>
          <Select value={months} onValueChange={(v) => patch({ months: v, page: "1" })}>
            <SelectTrigger>
              <SelectValue placeholder="Months" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m} value={m}>
                  Last {m} month{m !== "1" ? "s" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Tip: copy the URL to share the same analytics range.
      </p>
    </div>
  );
}
