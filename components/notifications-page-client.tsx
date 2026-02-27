"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ListQueryControls } from "@/components/list-query-controls";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message?: string | null;   // DB column is "message"
  href?: string | null;
  read: boolean;             // DB column is "read"
  created_at: string;
};

export function NotificationsPageClient({ initialItems }: { initialItems: NotificationItem[] }) {
  const router = useRouter();

  const resultsCount = useMemo(() => initialItems.length, [initialItems]);

  async function markRead(id: string, isRead: boolean) {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ read: isRead }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ListQueryControls
        resultsCount={resultsCount}
        search={{ placeholder: "Search notifications..." }}
        filters={[
          {
            key: "unread",
            label: "Status",
            defaultValue: "all",
            options: [
              { value: "all", label: "All" },
              { value: "1", label: "Unread" },
            ],
          },
        ]}
        sort={{
          options: [{ value: "created_at:desc", label: "Newest" }],
        }}
      />

      <div className="grid gap-3">
        {initialItems.length === 0 ? (
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">No notifications found.</div>
        ) : (
          initialItems.map((n) => (
            <div key={n.id} className={`rounded-lg border p-4 ${n.read ? "bg-background" : "bg-muted/40"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold">{n.title}</div>
                  {n.message ? <div className="text-sm text-muted-foreground mt-1">{n.message}</div> : null}
                  {n.href ? (
                    <div className="mt-3">
                      <Link
                        href={n.href}
                        onClick={() => void markRead(n.id, true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Open
                      </Link>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!n.read ? (
                    <Button variant="outline" size="sm" onClick={() => markRead(n.id, true)}>
                      <Check className="h-4 w-4 mr-2" />
                      Mark read
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="icon" onClick={() => remove(n.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
