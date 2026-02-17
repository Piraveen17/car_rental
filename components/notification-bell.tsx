"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  href?: string | null;
  is_read: boolean;
  created_at: string;
};

/**
 * Simple in-app notifications bell.
 * - polls for unread count
 * - shows latest items
 * - best-effort toast for new items (per browser) using localStorage cursor
 */
export function NotificationBell({ className }: { className?: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const pollingRef = useRef<number | null>(null);

  const latestId = useMemo(() => items?.[0]?.id, [items]);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications?page=1&page_size=10", { cache: "no-store" });
      const json = await res.json();
      const nextItems = (json?.items ?? []) as NotificationItem[];
      setItems(nextItems);

      const unread = nextItems.filter((n) => !n.is_read).length;
      setUnreadCount(unread);

      // Toast new items (cursor-based)
      const cursorKey = "notifications:lastSeenId";
      const lastSeen = localStorage.getItem(cursorKey);
      if (nextItems.length > 0 && lastSeen && nextItems[0].id !== lastSeen) {
        // There may be multiple new items; toast only the newest to avoid spam
        toast({
          title: nextItems[0].title,
          description: nextItems[0].body || undefined,
        });
      }
      if (nextItems.length > 0) {
        localStorage.setItem(cursorKey, nextItems[0].id);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchNotifications();
    pollingRef.current = window.setInterval(fetchNotifications, 15_000);
    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markRead(id: string, isRead: boolean) {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_read: isRead }),
    });
    fetchNotifications();
  }

  async function remove(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    fetchNotifications();
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className} aria-label="Notifications">
          <div className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[360px]">
          {items.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No notifications yet.</div>
          ) : (
            <div className="p-2 space-y-2">
              {items.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-lg border p-3 ${n.is_read ? "bg-background" : "bg-muted/40"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{n.title}</div>
                      {n.body ? <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.body}</div> : null}
                      {n.href ? (
                        <div className="mt-2">
                          <Link
                            href={n.href}
                            onClick={() => {
                              setOpen(false);
                              void markRead(n.id, true);
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            Open
                          </Link>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!n.is_read && (
                        <Button variant="ghost" size="icon" onClick={() => markRead(n.id, true)} aria-label="Mark as read">
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => remove(n.id)} aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/notifications" className="cursor-pointer">
            View all
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
