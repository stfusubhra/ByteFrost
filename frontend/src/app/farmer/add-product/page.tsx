"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RequireRole from "@/components/RequireRole";
import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/ui";
import { useMarketplaceStore } from "@/store/marketplace";
import { useAuthStore } from "@/store/auth";
import { demoCategories } from "@/lib/demoData";
import { CheckCircle } from "lucide-react";

const PRODUCT_EMOJIS: Record<string, string> = {
  Rice: "🌾",
  Wheat: "🌾",
  Potatoes: "🥔",
  Tomatoes: "🍅",
  Mustard: "🌱",
  Onions: "🧅",
  Carrots: "🥕",
  Spinach: "🥬",
  Mangoes: "🥭",
  Bananas: "🍌",
  Apples: "🍎",
  Oranges: "🍊",
  Cauliflower: "🥦",
  Cabbage: "🥬",
  Chillies: "🌶️",
  Corn: "🌽",
  Grapes: "🍇",
  Pomegranate: "🍎",
  Turmeric: "🌱",
  Soybean: "🫘",
};

export default function AddProductPage() {
  return (
    <RequireRole role="farmer">
      <DashboardLayout role="farmer">
        <AddProduct />
      </DashboardLayout>
    </RequireRole>
  );
}

function AddProduct() {
  const router = useRouter();
  const { user } = useAuthStore();
  const addListing = useMarketplaceStore((s) => s.addListing);

  const [form, setForm] = useState({
    crop_name: "",
    category: "Grains",
    variety: "",
    description: "",
    quantity_kg: "",
    unit: "kg",
    price_per_kg: "",
    pickup_location: "",
    min_order_quantity: "",
    quality_grade: "A",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const quantity = parseFloat(form.quantity_kg);
    const price = parseFloat(form.price_per_kg);
    const minOrder = parseFloat(form.min_order_quantity) || 1;

    if (!form.crop_name.trim()) {
      setError("Please enter a product name.");
      return;
    }
    if (!quantity || quantity <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }
    if (!price || price <= 0) {
      setError("Please enter a valid price.");
      return;
    }
    if (!form.pickup_location.trim()) {
      setError("Please enter a pickup location.");
      return;
    }

    setSubmitting(true);
    try {
      addListing({
        seller_id: user?.id || "",
        seller_name: user?.full_name || "Farmer",
        crop_name: form.crop_name.trim(),
        category: form.category,
        variety: form.variety.trim() || undefined,
        description: form.description.trim() || undefined,
        quantity_kg: quantity,
        unit: form.unit,
        min_order_quantity: minOrder,
        price_per_kg: price,
        quality_grade: form.quality_grade,
        pickup_location: form.pickup_location.trim(),
        images: [PRODUCT_EMOJIS[form.crop_name.trim()] || "🌾"],
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/farmer/listings");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to add product.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-green-800">
          Product Listed Successfully!
        </h2>
        <p className="mb-6 text-gray-500">
          Your product is now live in the marketplace.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/farmer/listings")}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            View My Listings
          </button>
          <button
            onClick={() => {
              setSuccess(false);
              setForm({
                crop_name: "",
                category: "Grains",
                variety: "",
                description: "",
                quantity_kg: "",
                unit: "kg",
                price_per_kg: "",
                pickup_location: "",
                min_order_quantity: "",
                quality_grade: "A",
              });
            }}
            className="rounded-lg border border-green-600 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50"
          >
            Add Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Add Product"
        subtitle="List your produce on the marketplace"
      />

      <div className="mx-auto max-w-2xl rounded-xl border border-green-100 bg-white p-6 shadow-sm md:p-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Product name *
              </label>
              <input
                name="crop_name"
                value={form.crop_name}
                onChange={handleChange}
                placeholder="e.g. Rice, Tomatoes, Onions"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {demoCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Variety
              </label>
              <input
                name="variety"
                value={form.variety}
                onChange={handleChange}
                placeholder="e.g. Basmati, Nasik Red"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Quality Grade
              </label>
              <select
                name="quality_grade"
                value={form.quality_grade}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="A">A - Premium</option>
                <option value="B">B - Good</option>
                <option value="C">C - Standard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe your produce..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Quantity *
              </label>
              <input
                name="quantity_kg"
                type="number"
                min="1"
                value={form.quantity_kg}
                onChange={handleChange}
                placeholder="5000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Unit
              </label>
              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="kg">kg</option>
                <option value="quintal">quintal</option>
                <option value="tonne">tonne</option>
                <option value="dozen">dozen</option>
                <option value="piece">piece</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Price per {form.unit} (₹) *
              </label>
              <input
                name="price_per_kg"
                type="number"
                min="1"
                value={form.price_per_kg}
                onChange={handleChange}
                placeholder="45"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Pickup Location *
              </label>
              <input
                name="pickup_location"
                value={form.pickup_location}
                onChange={handleChange}
                placeholder="e.g. Nandgaon, Nashik"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Minimum Order Quantity
              </label>
              <input
                name="min_order_quantity"
                type="number"
                min="1"
                value={form.min_order_quantity}
                onChange={handleChange}
                placeholder="50"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Publishing..." : "Publish Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
