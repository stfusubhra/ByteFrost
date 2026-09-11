"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import RequireRole from "@/components/RequireRole";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, EmptyState } from "@/components/ui";
import { useMarketplaceStore } from "@/store/marketplace";
import { formatINR } from "@/lib/demoData";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";

export default function CartPage() {
  return (
    <RequireRole role="buyer">
      <DashboardLayout role="buyer">
        <Cart />
      </DashboardLayout>
    </RequireRole>
  );
}

function Cart() {
  const router = useRouter();
  const cart = useMarketplaceStore((s) => s.cart);
  const listings = useMarketplaceStore((s) => s.listings);
  const updateCartQuantity = useMarketplaceStore((s) => s.updateCartQuantity);
  const removeFromCart = useMarketplaceStore((s) => s.removeFromCart);

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
  const deliveryFee = subtotal > 0 ? 0 : 0; // Free delivery for demo
  const total = subtotal + deliveryFee;

  if (cartItems.length === 0) {
    return (
      <div>
        <PageHeader title="Your Cart" />
        <EmptyState
          title="Your cart is empty"
          message="Browse the marketplace and add fresh produce to your cart."
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
        title="Your Cart"
        subtitle={`${cartItems.length} item${cartItems.length > 1 ? "s" : ""} in your cart`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cart items */}
        <div className="space-y-3 lg:col-span-2">
          {cartItems.map((item) => (
            <div
              key={item.listing_id}
              className="flex flex-col gap-3 rounded-xl border border-green-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-green-50 text-3xl">
                {item.listing.images[0] || "🌾"}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {item.listing.crop_name}
                </p>
                <p className="text-xs text-gray-500">
                  {item.listing.seller_name} • {item.listing.pickup_location}
                </p>
                <p className="mt-1 text-sm font-medium text-green-700">
                  {formatINR(item.listing.price_per_kg)}/{item.listing.unit}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-gray-300">
                  <button
                    onClick={() =>
                      updateCartQuantity(
                        item.listing_id,
                        Math.max(
                          item.listing.min_order_quantity,
                          item.quantity_kg - 1
                        )
                      )
                    }
                    className="p-2 text-gray-500 hover:text-green-700"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center text-sm font-semibold text-gray-900">
                    {item.quantity_kg}
                  </span>
                  <button
                    onClick={() =>
                      updateCartQuantity(
                        item.listing_id,
                        Math.min(
                          item.listing.quantity_kg,
                          item.quantity_kg + 1
                        )
                      )
                    }
                    className="p-2 text-gray-500 hover:text-green-700"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="w-24 text-right font-semibold text-gray-900">
                  {formatINR(item.quantity_kg * item.listing.price_per_kg)}
                </span>
                <button
                  onClick={() => removeFromCart(item.listing_id)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="h-fit rounded-xl border border-green-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Order Summary
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-900">
                {formatINR(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery</span>
              <span className="font-medium text-green-600">Free</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-green-700">
                {formatINR(total)}
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push("/buyer/checkout")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
          >
            <ShoppingCart size={16} />
            Proceed to Checkout
          </button>
          <Link
            href="/marketplace"
            className="mt-3 block text-center text-sm font-medium text-green-600 hover:text-green-700"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}