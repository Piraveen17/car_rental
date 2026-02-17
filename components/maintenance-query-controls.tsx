import { SimpleQueryControls } from "@/components/simple-query-controls";

type Props = {
  resultsCount: number;
};

export function MaintenanceQueryControls({ resultsCount }: Props) {
  return (
    <SimpleQueryControls
      resultsCount={resultsCount}
      placeholder="Search issue, type, car…"
      statusOptions={[
        { value: "pending", label: "Pending" },
        { value: "fixed", label: "Fixed" },
      ]}
      sortOptions={[
        { value: "date:desc", label: "Date (newest)" },
        { value: "date:asc", label: "Date (oldest)" },
        { value: "cost:desc", label: "Cost (high → low)" },
        { value: "cost:asc", label: "Cost (low → high)" },
        { value: "created_at:desc", label: "Created (newest)" },
        { value: "created_at:asc", label: "Created (oldest)" },
      ]}
    />
  );
}
