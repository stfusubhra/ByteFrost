"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMarketplaceStore } from "@/store/marketplace";
import { useAuthStore } from "@/store/auth";
import { formatINR, formatDate } from "@/lib/demoData";
import { Heart, ShoppingCart, Minus, Plus, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const listings = useMarketplaceStore((s) => s.listings);
  const favorites = useMarketplaceStore((s) => s.favorites);
  const toggleFavorite = useMarketplaceStore((s) => s.toggleFavorite);
  const addToCart = useMarketplaceStore((s) => s.addToCart);

  const listing = listings.find((l) => l.id === params?.id);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!listing) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-7xl flex-col items-center justify-center px-4 text-center">
        <p className="mb-4 text-gray-500">Product not found.</p>
        <Link
          href="/marketplace"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isFav = favorites.includes(listing.id);
  const total = quantity * listing.price_per_kg;
  const maxQty = Math.min(listing.quantity_kg, 1000);

  const handleAddToCart = () => {
    addToCart(listing.id, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(listing.id, quantity);
    router.push(user ? "/buyer/checkout" : "/login");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/marketplace"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700"
      >
        <ArrowLeft size={16} />
        Back to Marketplace
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product image */}
        <div className="flex h-80 items-center justify-center rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-green-100 text-[10rem] shadow-sm">
          {listing.images[0] || "🌾"}
        </div>

        {/* Product info */}
        <div>
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {listing.crop_name}
              </h1>
              <p className="mt-1 text-gray-500">
                {listing.category}
                {listing.variety ? ` • ${listing.variety}` : ""}
                {listing.quality_grade ? ` • Grade ${listing.quality_grade}` : ""}
              </p>
            </div>
            <button
              onClick={() => toggleFavorite(listing.id)}
              className={cn(
                "rounded-lg p-2 transition",
                isFav ? "text-red-500" : "text-gray-300 hover:text-red-400"
              )}
              title={isFav ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart size={24} fill={isFav ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <span className="text-3xl font-bold text-green-700">
              {formatINR(listing.price_per_kg)}
              <span className="text-base font-normal text-gray-500">
                /{listing.unit}
              </span>
            </span>
            {listing.rating && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                ★ {listing.rating} rating
              </span>
            )}
          </div>

          {listing.description && (
            <p className="mb-4 text-gray-600">{listing.description}</p>
          )}

          {/* Farmer info */}
          <div className="mb-4 rounded-xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
              Seller
            </p>
            <p className="mt-1 font-semibold text-gray-900">
              👨‍🌾 {listing.seller_name}
            </p>
            <p className="text-sm text-gray-600">
              📍 {listing.pickup_location}
            </p>
          </div>

          {/* Availability */}
          <div className="mb-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-gray-100 p-3">
              <p className="text-lg font-bold text-gray-900">
                {listing.quantity_kg.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">{listing.unit} available</p>
            </div>
            <div className="rounded-lg border border-gray-100 p-3">
              <p className="text-lg font-bold text-gray-900">
                {listing.min_order_quantity}
              </p>
              <p className="text-xs text-gray-500">Min. order ({listing.unit})</p>
            </div>
            <div className="rounded-lg border border-gray-100 p-3">
              <p className="text-lg font-bold text-gray-900">
                {formatDate(listing.created_at)}
              </p>
              <p className="text-xs text-gray-500">Listed on</p>
            </div>
          </div>

          {/* Quantity selector */}
          <div className="mb-4 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Quantity</span>
            <div className="flex items-center rounded-lg border border-gray-300">
              <button
                onClick={() => setQuantity(Math.max(listing.min_order_quantity, quantity - 1))}
                className="p-2 text-gray-500 hover:text-green-700"
              >
                <Minus size={16} />
              </button>
              <span className="w-16 text-center font-semibold text-gray-900">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                className="p-2 text-gray-500 hover:text-green-700"
              >
                <Plus size={16} />
              </button>
            </div>
            <span className="text-sm text-gray-500">{listing.unit}</span>
          </div>

          {/* Total */}
          <div className="mb-6 flex items-center justify-between rounded-xl border border-green-100 bg-white p-4">
            <span className="text-sm font-medium text-gray-600">
              Total ({quantity} {listing.unit})
            </span>
            <span className="text-2xl font-bold text-green-700">
              {formatINR(total)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-green-600 px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-50"
            >
              <ShoppingCart size={18} />
              {added ? "Added ✓" : "Add to Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}