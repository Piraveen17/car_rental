"use client";

import { ListQueryControls } from "@/components/list-query-controls";

type Props = {
  resultsCount: number;
};

export function CarsQueryControls({ resultsCount }: Props) {
  return (
    <ListQueryControls
      resultsCount={resultsCount}
      search={{ placeholder: "Search by brand, model, or location…" }}
      sort={{
        options: [
          { value: "created_at:desc", label: "Newest" },
          { value: "price:asc", label: "Price: Low → High" },
          { value: "price:desc", label: "Price: High → Low" },
          { value: "year:desc", label: "Year: Newest" },
          { value: "year:asc", label: "Year: Oldest" },
          { value: "seats:desc", label: "Seats: Most" },
          { value: "make:asc", label: "Brand: A → Z" },
        ],
      }}
    />
  );
}
