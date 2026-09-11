"use client";

import { useState } from "react";
import Link from "next/link";
import RequireRole from "@/components/RequireRole";
import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge, PageHeader, EmptyState } from "@/components/ui";
import { useMarketplaceStore } from "@/store/marketplace";
import { useAuthStore } from "@/store/auth";
import { formatINR, formatDate } from "@/lib/demoData";
import { Pencil, Trash2, Eye, PlusCircle, Power } from "lucide-react";

export default function FarmerListingsPage() {
  return (
    <RequireRole role="farmer">
      <DashboardLayout role="farmer">
        <FarmerListings />
      </DashboardLayout>
    </RequireRole>
  );
}

function FarmerListings() {
  const { user } = useAuthStore();
  const listings = useMarketplaceStore((s) => s.listings);
  const deleteListing = useMarketplaceStore((s) => s.deleteListing);
  const toggleListingActive = useMarketplaceStore((s) => s.toggleListingActive);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [viewListing, setViewListing] = useState<any>(null);

  const myListings = listings.filter((l) => l.seller_id === user?.id);

  const handleDelete = (id: string) => {
    deleteListing(id);
    setConfirmDelete(null);
  };

  return (
    <div>
      <PageHeader
        title="My Listings"
        subtitle={`${myListings.length} total listings`}
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

      {myListings.length === 0 ? (
        <EmptyState
          title="No listings yet"
          message="Add your first product to start selling on the marketplace."
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
        <div className="overflow-x-auto rounded-xl border border-green-100 bg-white shadow-sm">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-green-100 bg-green-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Product</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Category</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Quantity</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Price</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Date Listed</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myListings.map((listing) => (
                <tr key={listing.id} className="hover:bg-green-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-xl">
                        {listing.images[0] || "🌾"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{listing.crop_name}</p>
                        {listing.variety && (
                          <p className="text-xs text-gray-500">{listing.variety}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{listing.category}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {listing.quantity_kg.toLocaleString()} {listing.unit}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatINR(listing.price_per_kg)}/{listing.unit}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={listing.is_active ? "active" : "inactive"} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(listing.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewListing(listing)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-green-100 hover:text-green-700"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <Link
                        href={`/farmer/edit-product/${listing.id}`}
                        className="rounded-lg p-2 text-gray-500 hover:bg-blue-100 hover:text-blue-700"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => toggleListingActive(listing.id)}
                        className={`rounded-lg p-2 ${
                          listing.is_active
                            ? "text-gray-500 hover:bg-amber-100 hover:text-amber-700"
                            : "text-green-600 hover:bg-green-100"
                        }`}
                        title={listing.is_active ? "Deactivate" : "Activate"}
                      >
                        <Power size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(listing.id)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-red-100 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Delete listing?
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              This will permanently remove the product from your listings and
              the marketplace. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View details modal */}
      {viewListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setViewListing(null)}
          />
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-50 text-3xl">
                  {viewListing.images[0] || "🌾"}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {viewListing.crop_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {viewListing.category}
                    {viewListing.variety ? ` • ${viewListing.variety}` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewListing(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Price</dt>
                <dd className="font-medium text-gray-900">
                  {formatINR(viewListing.price_per_kg)}/{viewListing.unit}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Quantity</dt>
                <dd className="font-medium text-gray-900">
                  {viewListing.quantity_kg.toLocaleString()} {viewListing.unit}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Min. Order</dt>
                <dd className="font-medium text-gray-900">
                  {viewListing.min_order_quantity} {viewListing.unit}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Location</dt>
                <dd className="font-medium text-gray-900">
                  {viewListing.pickup_location}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Quality Grade</dt>
                <dd className="font-medium text-gray-900">
                  {viewListing.quality_grade || "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <StatusBadge status={viewListing.is_active ? "active" : "inactive"} />
                </dd>
              </div>
              {viewListing.description && (
                <div className="border-t border-gray-100 pt-2">
                  <dt className="mb-1 text-gray-500">Description</dt>
                  <dd className="text-gray-700">{viewListing.description}</dd>
                </div>
              )}
            </dl>
            <div className="mt-6 flex gap-3">
              <Link
                href={`/farmer/edit-product/${viewListing.id}`}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-green-700"
              >
                Edit Listing
              </Link>
              <button
                onClick={() => setViewListing(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
