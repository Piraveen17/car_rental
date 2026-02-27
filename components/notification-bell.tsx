"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/store";

// Match DB schema: column is "message" not "body", "read" not "is_read"
type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message?: string | null;
  href?: string | null;
  read: boolean;
  created_at: string;
};

export function NotificationBell({ className }: { className?: string }) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchNotifications() {
    if (!isAuthenticated) return;
    try {
      const res = await fetch("/api/notifications?page=1&page_size=10", { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      const nextItems = (json?.items ?? []) as NotificationItem[];
      setItems(nextItems);
      setUnreadCount(nextItems.filter((n) => !n.read).length);

      // Toast newest unseen notification
      const cursorKey = "notifications:lastSeenId";
      const lastSeen = localStorage.getItem(cursorKey);
      if (nextItems.length > 0 && lastSeen && nextItems[0].id !== lastSeen) {
        toast({ title: nextItems[0].title, description: nextItems[0].message || undefined });
      }
      if (nextItems.length > 0) localStorage.setItem(cursorKey, nextItems[0].id);
    } catch {
      // ignore - not critical
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    pollingRef.current = setInterval(fetchNotifications, 30_000); // 30s poll
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ read: true }),
      credentials: "include",
    });
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function remove(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "DELETE", credentials: "include" });
    setItems((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  if (!isAuthenticated) return null;

  return (
    <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); if (v) fetchNotifications(); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className} aria-label="Notifications">
          <div className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 flex flex-col h-[400px]">
        <DropdownMenuLabel className="flex items-center justify-between py-2 shrink-0">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="shrink-0" />

        <div className="flex-1 min-h-0 overflow-hidden relative">
          <ScrollArea className="h-full w-full">
            {items.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              <div className="p-1 space-y-1">
                {items.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-lg p-3 group transition-colors flex ${
                      n.read ? "hover:bg-muted/50" : "bg-primary/5 border border-primary/10"
                    }`}
                  >
                    <div className="flex items-start gap-2 w-full">
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug break-words pr-2">{n.title}</p>
                        {n.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 break-words pr-2">{n.message}</p>
                        )}
                        {n.href && (
                          <Link
                            href={n.href}
                            onClick={() => { setOpen(false); if (!n.read) markRead(n.id); }}
                            className="text-xs text-primary hover:underline mt-1 inline-block"
                            tabIndex={-1}
                          >
                            View →
                          </Link>
                        )}
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-auto self-start">
                        {!n.read && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => markRead(n.id)} title="Mark read" tabIndex={-1}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => remove(n.id)} title="Delete" tabIndex={-1}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DropdownMenuSeparator className="shrink-0" />
        <div className="shrink-0 p-1">
          <DropdownMenuItem asChild className="cursor-pointer justify-center text-sm text-primary py-2 w-full">
            <Link href="/dashboard/notifications">View all notifications</Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}