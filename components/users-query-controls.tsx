"use client";

import { ListQueryControls } from "@/components/list-query-controls";

type Props = {
  resultsCount: number;
};

export function UsersQueryControls({ resultsCount }: Props) {
  return (
    <ListQueryControls
      resultsCount={resultsCount}
      search={{ placeholder: "Search name, email, phone…" }}
      filters={[
        {
          key: "role",
          label: "Role",
          widthClassName: "w-[190px]",
          options: [
            { value: "all", label: "All roles" },
            { value: "customer", label: "Customer" },
            { value: "staff", label: "Staff" },
            { value: "admin", label: "Admin" },
          ],
        },
      ]}
      sort={{
        widthClassName: "w-[220px]",
        options: [
          { value: "created_at:desc", label: "Newest" },
          { value: "created_at:asc", label: "Oldest" },
          { value: "name:asc", label: "Name (A–Z)" },
          { value: "name:desc", label: "Name (Z–A)" },
          { value: "email:asc", label: "Email (A–Z)" },
          { value: "email:desc", label: "Email (Z–A)" },
        ],
      }}
    />
  );
}
