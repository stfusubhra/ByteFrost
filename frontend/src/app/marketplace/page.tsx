"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMarketplaceStore } from "@/store/marketplace";
import { formatINR } from "@/lib/demoData";
import { Search, Heart, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MarketplacePage() {
  const listings = useMarketplaceStore((s) => s.listings);
  const favorites = useMarketplaceStore((s) => s.favorites);
  const toggleFavorite = useMarketplaceStore((s) => s.toggleFavorite);
  const addToCart = useMarketplaceStore((s) => s.addToCart);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [addedMsg, setAddedMsg] = useState<string | null>(null);

  const activeListings = listings.filter((l) => l.is_active);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(activeListings.map((l) => l.category)))],
    [activeListings]
  );

  const locations = useMemo(
    () => ["all", ...Array.from(new Set(activeListings.map((l) => l.pickup_location)))],
    [activeListings]
  );

  const filtered = useMemo(() => {
    let result = activeListings.filter((l) => {
      if (
        search &&
        !l.crop_name.toLowerCase().includes(search.toLowerCase()) &&
        !(l.variety || "").toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (category !== "all" && l.category !== category) return false;
      if (location !== "all" && l.pickup_location !== location) return false;
      if (maxPrice && l.price_per_kg > parseFloat(maxPrice)) return false;
      return true;
    });

    switch (sort) {
      case "price_asc":
        result = [...result].sort((a, b) => a.price_per_kg - b.price_per_kg);
        break;
      case "price_desc":
        result = [...result].sort((a, b) => b.price_per_kg - a.price_per_kg);
        break;
      case "quantity":
        result = [...result].sort((a, b) => b.quantity_kg - a.quantity_kg);
        break;
      case "newest":
      default:
        result = [...result].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    return result;
  }, [activeListings, search, category, location, maxPrice, sort]);

  const handleAddToCart = (listingId: string, name: string) => {
    addToCart(listingId, 1);
    setAddedMsg(`${name} added to cart`);
    setTimeout(() => setAddedMsg(null), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-800">Marketplace</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fresh produce directly from farmers across India
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, varieties..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="quantity">Most Quantity</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition",
              showFilters
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-300 text-gray-600 hover:border-green-300"
            )}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-4 grid gap-3 rounded-xl border border-green-100 bg-white p-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l === "all" ? "All Locations" : l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Max Price (₹/kg)
            </label>
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="e.g. 50"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Toast */}
      {addedMsg && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          ✓ {addedMsg}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-green-200 bg-white px-6 py-16 text-center">
          <div className="mb-3 text-4xl">🔍</div>
          <h3 className="mb-1 text-lg font-semibold text-gray-900">
            No products found
          </h3>
          <p className="text-sm text-gray-500">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((listing) => {
            const isFav = favorites.includes(listing.id);
            return (
              <div
                key={listing.id}
                className="group flex flex-col rounded-xl border border-green-100 bg-white shadow-sm transition hover:shadow-md"
              >
                <Link
                  href={`/marketplace/${listing.id}`}
                  className="flex h-36 items-center justify-center rounded-t-xl bg-gradient-to-br from-green-50 to-green-100 text-6xl"
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
                        {listing.variety || listing.category}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(listing.id)}
                      className={cn(
                        "rounded-lg p-1.5 transition",
                        isFav
                          ? "text-red-500"
                          : "text-gray-300 hover:text-red-400"
                      )}
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-green-700">
                      {formatINR(listing.price_per_kg)}
                      <span className="text-xs font-normal text-gray-500">
                        /{listing.unit}
                      </span>
                    </span>
                    {listing.rating && (
                      <span className="text-xs font-medium text-amber-600">
                        ★ {listing.rating}
                      </span>
                    )}
                  </div>

                  <div className="mb-3 space-y-1 text-xs text-gray-500">
                    <p>👨‍🌾 {listing.seller_name}</p>
                    <p>📍 {listing.pickup_location}</p>
                    <p>
                      📦 {listing.quantity_kg.toLocaleString()} {listing.unit}{" "}
                      available
                    </p>
                  </div>

                  <div className="mt-auto flex gap-2">
                    <Link
                      href={`/marketplace/${listing.id}`}
                      className="flex-1 rounded-lg border border-green-600 px-3 py-2 text-center text-sm font-medium text-green-600 hover:bg-green-50"
                    >
                      View
                    </Link>
                    <button
                      onClick={() =>
                        handleAddToCart(listing.id, listing.crop_name)
                      }
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      <ShoppingCart size={14} />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}