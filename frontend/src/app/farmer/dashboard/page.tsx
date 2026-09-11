"use client";

import Link from "next/link";
import RequireRole from "@/components/RequireRole";
import DashboardLayout from "@/components/DashboardLayout";
import { StatCard, StatusBadge, PageHeader, EmptyState } from "@/components/ui";
import { useMarketplaceStore } from "@/store/marketplace";
import { useAuthStore } from "@/store/auth";
import { formatINR, formatDate } from "@/lib/demoData";
import {
  Package,
  CheckCircle,
  ShoppingCart,
  Wallet,
  TrendingUp,
  PlusCircle,
} from "lucide-react";

export default function FarmerDashboardPage() {
  return (
    <RequireRole role="farmer">
      <DashboardLayout role="farmer">
        <FarmerDashboard />
      </DashboardLayout>
    </RequireRole>
  );
}

function FarmerDashboard() {
  const { user } = useAuthStore();
  const listings = useMarketplaceStore((s) => s.listings);
  const orders = useMarketplaceStore((s) => s.orders);
  const transactions = useMarketplaceStore((s) => s.transactions);

  const myListings = listings.filter((l) => l.seller_id === user?.id);
  const activeListings = myListings.filter((l) => l.is_active);
  const myOrders = orders.filter((o) =>
    o.items.some((it) => it.seller_id === user?.id)
  );
  const pendingOrders = myOrders.filter(
    (o) => o.status === "pending" || o.status === "confirmed" || o.status === "processing"
  );
  const deliveredOrders = myOrders.filter((o) => o.status === "delivered");
  const myTransactions = transactions.filter((t) => t.farmer_id === user?.id);
  const completedEarnings = myTransactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingEarnings = myTransactions
    .filter((t) => t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);

  const recentOrders = myOrders.slice(0, 5);
  const recentListings = myListings.slice(0, 5);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.full_name?.split(" ")[0] || "Farmer"}! 🌾`}
        subtitle="Here's what's happening with your farm today."
        action={
          <Link
            href="/farmer/add-product"
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <PlusCircle size={16} />
            Add Product
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Listings" value={myListings.length} icon={<Package size={20} />} color="green" />
        <StatCard label="Active Listings" value={activeListings.length} icon={<CheckCircle size={20} />} color="blue" />
        <StatCard label="Products Sold" value={deliveredOrders.length} icon={<TrendingUp size={20} />} color="purple" />
        <StatCard label="Pending Orders" value={pendingOrders.length} icon={<ShoppingCart size={20} />} color="amber" />
        <StatCard label="Total Earnings" value={formatINR(completedEarnings)} icon={<Wallet size={20} />} color="green" />
        <StatCard label="Pending Earnings" value={formatINR(pendingEarnings)} icon={<Wallet size={20} />} color="amber" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/farmer/orders" className="text-sm font-medium text-green-600 hover:text-green-700">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              message="When buyers place orders, they'll appear here."
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
                      {order.buyer_name} • {formatDate(order.created_at)}
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

        {/* Recent Listings */}
        <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Listings</h2>
            <Link href="/farmer/listings" className="text-sm font-medium text-green-600 hover:text-green-700">
              View all
            </Link>
          </div>
          {recentListings.length === 0 ? (
            <EmptyState
              title="No listings yet"
              message="Add your first product to start selling."
              action={
                <Link
                  href="/farmer/add-product"
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Add Product
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {recentListings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
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
                        {listing.category} • {listing.quantity_kg} {listing.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatINR(listing.price_per_kg)}/{listing.unit}
                    </span>
                    <StatusBadge status={listing.is_active ? "active" : "inactive"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
