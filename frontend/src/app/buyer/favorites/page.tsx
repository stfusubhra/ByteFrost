"use client";

import Link from "next/link";
import RequireRole from "@/components/RequireRole";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, EmptyState } from "@/components/ui";
import { useMarketplaceStore } from "@/store/marketplace";
import { formatINR } from "@/lib/demoData";
import { Heart, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FavoritesPage() {
  return (
    <RequireRole role="buyer">
      <DashboardLayout role="buyer">
        <Favorites />
      </DashboardLayout>
    </RequireRole>
  );
}

function Favorites() {
  const listings = useMarketplaceStore((s) => s.listings);
  const favorites = useMarketplaceStore((s) => s.favorites);
  const toggleFavorite = useMarketplaceStore((s) => s.toggleFavorite);
  const addToCart = useMarketplaceStore((s) => s.addToCart);

  const favoriteListings = listings.filter(
    (l) => favorites.includes(l.id) && l.is_active
  );

  return (
    <div>
      <PageHeader
        title="Favorites"
        subtitle={`${favoriteListings.length} saved product${favoriteListings.length !== 1 ? "s" : ""}`}
      />

      {favoriteListings.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          message="Tap the heart icon on any product to save it here."
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteListings.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-col rounded-xl border border-green-100 bg-white shadow-sm transition hover:shadow-md"
            >
              <Link
                href={`/marketplace/${listing.id}`}
                className="flex h-32 items-center justify-center rounded-t-xl bg-gradient-to-br from-green-50 to-green-100 text-5xl"
              >
                {listing.images[0] || "🌾"}
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-1 flex items-start justify-between">
                  <div>
                    <Link
                      href={`/marketplace/${listing.id}`}
                      className="font-semibold text-gray-900 hover:text-green-700"
                    >
                      {listing.crop_name}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {listing.seller_name} • {listing.pickup_location}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(listing.id)}
                    className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50"
                    title="Remove from favorites"
                  >
                    <Heart size={18} fill="currentColor" />
                  </button>
                </div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-green-700">
                    {formatINR(listing.price_per_kg)}
                    <span className="text-xs font-normal text-gray-500">
                      /{listing.unit}
                    </span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {listing.quantity_kg.toLocaleString()} {listing.unit} left
                  </span>
                </div>
                <div className="mt-auto flex gap-2">
                  <Link
                    href={`/marketplace/${listing.id}`}
                    className="flex-1 rounded-lg border border-green-600 px-3 py-2 text-center text-sm font-medium text-green-600 hover:bg-green-50"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => addToCart(listing.id, 1)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    <ShoppingCart size={14} />
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}