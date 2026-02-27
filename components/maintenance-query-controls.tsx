import { SimpleQueryControls } from "@/components/simple-query-controls";

type Props = {
  resultsCount: number;
};

export function MaintenanceQueryControls({ resultsCount }: Props) {
  return (
    <SimpleQueryControls
      resultsCount={resultsCount}
      placeholder="Search description, type, car…"
      statusOptions={[
        { value: "pending",     label: "Pending" },
        { value: "in_progress", label: "In Progress" },
        { value: "completed",   label: "Completed" },
        { value: "cancelled",   label: "Cancelled" },
      ]}
      sortOptions={[
        { value: "created_at:desc", label: "Newest first" },
        { value: "created_at:asc",  label: "Oldest first" },
        { value: "start_date:desc", label: "Start date (latest)" },
        { value: "start_date:asc",  label: "Start date (earliest)" },
      ]}
    />
  );
}
