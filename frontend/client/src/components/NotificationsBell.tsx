import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Bell, CheckCheck } from "lucide-react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        fetchNotifications({ limit: 15 }),
        fetchUnreadCount(),
      ]);
      setItems(list);
      setUnread(count);
    } catch {
      // Notifications are non-critical; fail silently.
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) refresh();
  };

  const handleRead = async (id: string) => {
    await markNotificationRead(id).catch(() => {});
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead().catch(() => {});
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  };

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={handleOpen}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border bg-popover shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleReadAll}>
                <CheckCheck className="size-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">
                No notifications yet. Order and shipment updates will appear here.
              </p>
            ) : (
              <ul className="divide-y">
                {items.map((n) => (
                  <li key={n.id}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        className={cn(
                          "block px-4 py-3 transition-colors hover:bg-muted/50",
                          !n.is_read && "bg-primary/5"
                        )}
                        onClick={() => handleRead(n.id)}
                      >
                        <NotificationRow n={n} />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className={cn(
                          "block w-full px-4 py-3 text-left transition-colors hover:bg-muted/50",
                          !n.is_read && "bg-primary/5"
                        )}
                        onClick={() => handleRead(n.id)}
                      >
                        <NotificationRow n={n} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({ n }: { n: NotificationItem }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{n.title}</span>
          {!n.is_read && <Badge className="size-1.5 shrink-0 rounded-full p-0" />}
        </div>
        {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
        <span className="mt-1 block text-[10px] uppercase tracking-wide text-muted-foreground/70">
          {n.category} · {timeAgo(n.created_at)}
        </span>
      </div>
    </div>
  );
}