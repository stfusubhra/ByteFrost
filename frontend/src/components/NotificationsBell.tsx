"use client";

import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useMarketplaceStore } from "@/store/marketplace";
import { useAuthStore } from "@/store/auth";
import { formatDateTime } from "@/lib/demoData";

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();
  const notifications = useMarketplaceStore((s) => s.notifications);
  const markAllRead = useMarketplaceStore((s) => s.markAllNotificationsRead);
  const markRead = useMarketplaceStore((s) => s.markNotificationRead);

  const myNotifications = notifications.filter((n) => n.user_id === user?.id);
  const unread = myNotifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-600 hover:bg-green-50 hover:text-green-700"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-green-100 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-green-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Notifications
              </h3>
              {unread > 0 && (
                <button
                  onClick={() => markAllRead(user?.id || "")}
                  className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {myNotifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-500">
                  No notifications yet
                </p>
              ) : (
                myNotifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`block w-full border-b border-gray-50 px-4 py-3 text-left transition hover:bg-green-50 ${
                      n.read ? "opacity-60" : ""
                    }`}
                  >
                    <p className="text-sm text-gray-800">{n.message}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDateTime(n.created_at)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
