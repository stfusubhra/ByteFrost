"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RequireRole from "@/components/RequireRole";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, EmptyState } from "@/components/ui";
import { useMarketplaceStore } from "@/store/marketplace";
import { useAuthStore } from "@/store/auth";
import { formatINR } from "@/lib/demoData";
import { CheckCircle } from "lucide-react";

export default function CheckoutPage() {
  return (
    <RequireRole role="buyer">
      <DashboardLayout role="buyer">
        <Checkout />
      </DashboardLayout>
    </RequireRole>
  );
}

function Checkout() {
  const router = useRouter();
  const { user } = useAuthStore();
  const cart = useMarketplaceStore((s) => s.cart);
  const listings = useMarketplaceStore((s) => s.listings);
  const placeOrder = useMarketplaceStore((s) => s.placeOrder);

  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  const cartItems = cart
    .map((ci) => {
      const listing = listings.find((l) => l.id === ci.listing_id);
      if (!listing) return null;
      return { ...ci, listing };
    })
    .filter(Boolean) as {
    listing_id: string;
    quantity_kg: number;
    listing: (typeof listings)[number];
  }[];

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.quantity_kg * item.listing.price_per_kg,
    0
  );
  const total = subtotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.full_name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (!form.address.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    setPlacing(true);
    try {
      const order = placeOrder(
        {
          id: user?.id || "demo-buyer-1",
          name: form.full_name.trim(),
          phone: form.phone.trim(),
        },
        form.address.trim()
      );
      if (order) {
        setPlacedOrder(order);
      } else {
        setError("Your cart is empty.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to place order.");
    } finally {
      setPlacing(false);
    }
  };

  // Order confirmation screen
  if (placedOrder) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-green-800">
          Order Placed Successfully!
        </h2>
        <p className="mb-1 text-gray-600">
          Your order <span className="font-bold">#{placedOrder.id}</span> has
          been placed.
        </p>
        <p className="mb-6 text-sm text-gray-500">
          Total: {formatINR(placedOrder.total_amount)} • The farmer has been
          notified.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/buyer/orders")}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Track My Order
          </button>
          <button
            onClick={() => router.push("/marketplace")}
            className="rounded-lg border border-green-600 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div>
        <PageHeader title="Checkout" />
        <EmptyState
          title="Your cart is empty"
          message="Add products to your cart before checking out."
          action={
            <Link
              href="/marketplace"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Browse Marketplace
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Checkout"
        subtitle="Review your order and confirm delivery details"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Delivery form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-green-100 bg-white p-6 shadow-sm lg:col-span-2"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            Delivery Details
          </h2>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Full name *
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Your full name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Phone number *
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Delivery address *
            </label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              placeholder="Shop / house number, street, city, state"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Payment method (demo) */}
          <div>
            <span className="mb-2 block text-sm font-medium text-gray-700">
              Payment method
            </span>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  checked
                  readOnly
                  className="h-4 w-4 accent-green-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Demo Payment (UPI)
                  </p>
                  <p className="text-xs text-gray-500">
                    No real payment will be charged — this is a demo checkout.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={placing}
            className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {placing ? "Placing order..." : "Place Demo Order"}
          </button>
        </form>

        {/* Order summary */}
        <div className="h-fit rounded-xl border border-green-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Order Summary
          </h2>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div
                key={item.listing_id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.listing.images[0] || "🌾"}</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.listing.crop_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.quantity_kg} {item.listing.unit} ×{" "}
                      {formatINR(item.listing.price_per_kg)}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-gray-900">
                  {formatINR(item.quantity_kg * item.listing.price_per_kg)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-gray-100 pt-3">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-xl font-bold text-green-700">
              {formatINR(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}