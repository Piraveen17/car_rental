"use client";
import { ListQueryControls } from "@/components/list-query-controls";

type Props = {
  resultsCount: number;
};

export function BookingsQueryControls({ resultsCount }: Props) {
  return (
    <ListQueryControls
      resultsCount={resultsCount}
      search={{ placeholder: "Search booking id, customer, car…" }}
      filters={[
        {
          key: "status",
          label: "Status",
          options: [
            { value: "all", label: "All statuses" },
            { value: "pending", label: "Pending" },
            { value: "confirmed", label: "Confirmed" },
            { value: "cancelled", label: "Cancelled" },
            { value: "completed", label: "Completed" },
            { value: "rejected", label: "Rejected" },
          ],
        },
      ]}
      sort={{
        options: [
          { value: "created_at:desc", label: "Newest" },
          { value: "created_at:asc", label: "Oldest" },
          { value: "start_date:asc", label: "Start date" },
          { value: "end_date:asc", label: "End date" },
          { value: "total_amount:desc", label: "Total: High → Low" },
          { value: "total_amount:asc", label: "Total: Low → High" },
        ],
      }}
    />
  );
}
