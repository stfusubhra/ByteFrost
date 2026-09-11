"use client";

import { useState } from "react";
import RequireRole from "@/components/RequireRole";
import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge, PageHeader, EmptyState, OrderProgress } from "@/components/ui";
import { useMarketplaceStore } from "@/store/marketplace";
import { useAuthStore } from "@/store/auth";
import { formatINR, formatDateTime } from "@/lib/demoData";
import { ChevronRight } from "lucide-react";

const STATUS_FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function FarmerOrdersPage() {
  return (
    <RequireRole role="farmer">
      <DashboardLayout role="farmer">
        <FarmerOrders />
      </DashboardLayout>
    </RequireRole>
  );
}

function FarmerOrders() {
  const { user } = useAuthStore();
  const orders = useMarketplaceStore((s) => s.orders);
  const updateOrderStatus = useMarketplaceStore((s) => s.updateOrderStatus);
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const myOrders = orders
    .filter((o) => o.items.some((it) => it.seller_id === user?.id))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const filtered =
    filter === "all" ? myOrders : myOrders.filter((o) => o.status === filter);

  const counts = {
    all: myOrders.length,
    pending: myOrders.filter((o) => o.status === "pending").length,
    confirmed: myOrders.filter((o) => o.status === "confirmed").length,
    processing: myOrders.filter((o) => o.status === "processing").length,
    shipped: myOrders.filter((o) => o.status === "shipped").length,
    delivered: myOrders.filter((o) => o.status === "delivered").length,
  };

  const advanceStatus = (order: any) => {
    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) {
      updateOrderStatus(order.id, STATUS_FLOW[idx + 1]);
    }
  };

  const tabs = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "processing", label: "Processing" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
  ];

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Orders placed by buyers for your products"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === t.key
                ? "bg-green-600 text-white"
                : "border border-green-200 bg-white text-gray-600 hover:bg-green-50"
            }`}
          >
            {t.label} ({counts[t.key as keyof typeof counts]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No orders found"
          message="Orders placed by buyers for your products will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-green-100 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-lg font-bold text-green-700">
                    {order.buyer_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      #{order.id}
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        {order.buyer_name}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(order.created_at)} •{" "}
                      {order.items.map((it) => it.crop_name).join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">
                    {formatINR(order.total_amount)}
                  </span>
                  <StatusBadge status={order.status} />
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="rounded-lg border border-green-200 p-1.5 text-green-600 hover:bg-green-50"
                    title="View details"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Order #{selectedOrder.id}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDateTime(selectedOrder.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 rounded-lg bg-green-50 p-4">
              <OrderProgress status={selectedOrder.status} />
            </div>

            <div className="mb-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-700">
                Buyer Information
              </h4>
              <div className="rounded-lg border border-gray-100 p-3 text-sm">
                <p className="font-medium text-gray-900">
                  {selectedOrder.buyer_name}
                </p>
                <p className="text-gray-500">{selectedOrder.buyer_phone}</p>
                <p className="mt-1 text-gray-500">
                  📍 {selectedOrder.delivery_address}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="mb-2 text-sm font-semibold text-gray-700">
                Items
              </h4>
              <div className="space-y-2">
                {selectedOrder.items
                  .filter((it: any) => it.seller_id === user?.id)
                  .map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-gray-100 p-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.image || "🌾"}</span>
                        <span className="font-medium text-gray-900">
                          {item.crop_name}
                        </span>
                      </div>
                      <span className="text-gray-600">
                        {item.quantity_kg} kg × {formatINR(item.price_per_kg)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mb-4 flex justify-between border-t border-gray-100 pt-3">
              <span className="text-sm font-medium text-gray-700">Total</span>
              <span className="text-lg font-bold text-gray-900">
                {formatINR(selectedOrder.total_amount)}
              </span>
            </div>

            {selectedOrder.status !== "delivered" &&
              selectedOrder.status !== "cancelled" && (
                <button
                  onClick={() => {
                    advanceStatus(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  Mark as{" "}
                  {STATUS_FLOW[
                    Math.min(
                      STATUS_FLOW.indexOf(selectedOrder.status) + 1,
                      STATUS_FLOW.length - 1
                    )
                  ]}
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  );
}