"use client";

import Link from "next/link";
import RequireRole from "@/components/RequireRole";
import DashboardLayout from "@/components/DashboardLayout";
import { StatCard, StatusBadge, PageHeader, EmptyState } from "@/components/ui";
import { useMarketplaceStore } from "@/store/marketplace";
import { useAuthStore } from "@/store/auth";
import { formatINR, formatDate } from "@/lib/demoData";
import { Package, Clock, CheckCircle, Wallet, Heart, Store } from "lucide-react";

export default function BuyerDashboardPage() {
  return (
    <RequireRole role="buyer">
      <DashboardLayout role="buyer">
        <BuyerDashboard />
      </DashboardLayout>
    </RequireRole>
  );
}

function BuyerDashboard() {
  const { user } = useAuthStore();
  const orders = useMarketplaceStore((s) => s.orders);
  const favorites = useMarketplaceStore((s) => s.favorites);
  const listings = useMarketplaceStore((s) => s.listings);

  const myOrders = orders
    .filter((o) => o.buyer_id === user?.id)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  const activeOrders = myOrders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled"
  );
  const completedOrders = myOrders.filter((o) => o.status === "delivered");
  const totalSpending = myOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const favoriteListings = listings.filter((l) => favorites.includes(l.id));

  const recentOrders = myOrders.slice(0, 5);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.full_name?.split(" ")[0] || "Buyer"}! 🏪`}
        subtitle="Fresh produce from farmers, directly to you."
        action={
          <Link
            href="/marketplace"
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <Store size={16} />
            Browse Marketplace
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Orders" value={myOrders.length} icon={<Package size={20} />} color="green" />
        <StatCard label="Active Orders" value={activeOrders.length} icon={<Clock size={20} />} color="amber" />
        <StatCard label="Completed" value={completedOrders.length} icon={<CheckCircle size={20} />} color="blue" />
        <StatCard label="Total Spending" value={formatINR(totalSpending)} icon={<Wallet size={20} />} color="purple" />
        <StatCard label="Favorites" value={favoriteListings.length} icon={<Heart size={20} />} color="red" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/buyer/orders" className="text-sm font-medium text-green-600 hover:text-green-700">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              message="When you place orders, they'll appear here."
              action={
                <Link
                  href="/marketplace"
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Browse Marketplace
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      #{order.id}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.items.map((it) => it.crop_name).join(", ")} •{" "}
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatINR(order.total_amount)}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Favorites */}
        <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Saved Products
            </h2>
            <Link href="/buyer/favorites" className="text-sm font-medium text-green-600 hover:text-green-700">
              View all
            </Link>
          </div>
          {favoriteListings.length === 0 ? (
            <EmptyState
              title="No favorites yet"
              message="Save products you're interested in for quick access."
              action={
                <Link
                  href="/marketplace"
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Explore Marketplace
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {favoriteListings.slice(0, 5).map((listing) => (
                <Link
                  key={listing.id}
                  href={`/marketplace/${listing.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition hover:bg-green-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-xl">
                      {listing.images[0] || "🌾"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {listing.crop_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {listing.seller_name} • {listing.pickup_location}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatINR(listing.price_per_kg)}/{listing.unit}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}