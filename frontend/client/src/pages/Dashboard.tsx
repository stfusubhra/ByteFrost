/* KisanSetu Field Ledger – core product dashboard.
 * This component now fetches real data from the backend:
 *   - Active listings for the logged-in farmer
 *   - Price recommendation for the selected listing
 *   - Demand forecast for the active crop
 *   - Buyer matching scores (real API)
 * The UI falls back to a friendly empty state when no data is available.
 */
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  ChevronRight,
  CircleHelp,
  CloudSun,
  Edit,
  FilePlus2,
  LayoutDashboard,
  Loader2,
  MapPinned,
  Menu,
  PackageCheck,
  Settings2,
  ShieldCheck,
  Sprout,
  Truck,
  UsersRound,
  X,
  Navigation,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import RouteMap from "@/components/RouteMap";
import TrackingTimeline from "@/components/TrackingTimeline";
import {
  fetchListings,
  fetchMatches,
  fetchPriceRecommendation,
  fetchDemandForecast,
  fetchShipments,
  fetchShipment,
  fetchTracking,
  fetchIncomingOrders,
  createListing,
  updateListing,
  Listing,
  ListingCreatePayload,
  ListingUpdatePayload,
  OrderResponse,
  ShipmentItem,
  ShipmentDetailItem,
  TrackingStatusData,
  ApiError,
  DemandForecastData,
} from "@/lib/api";
import type { LocaleKeys } from "@/locales";

function SignalBars({ value, tone = "green" }: { value: number; tone?: string }) {
  return (
    <div className={`signal-bars ${tone}`} aria-label={`${value}% match`}>
      <span style={{ height: `${Math.max(28, value * 0.62)}%` }} />
      <span style={{ height: `${Math.max(35, value * 0.74)}%` }} />
      <span style={{ height: `${Math.max(45, value * 0.86)}%` }} />
      <span style={{ height: `${value}%` }} />
    </div>
  );
}

function CreateListingModal({
  isOpen,
  onClose,
  onCreated,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (listing: Listing) => void;
  t: (key: LocaleKeys) => string;
}) {
  const [form, setForm] = useState({
    crop_name: "",
    variety: "",
    quantity_kg: "",
    quality_grade: "A",
    price_per_kg: "",
    harvest_date: "",
    availability_start: "",
    availability_end: "",
    pickup_location: "",
    pickup_latitude: "",
    pickup_longitude: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.crop_name.trim()) {
      setError(t("createListing.err.cropName"));
      return;
    }
    if (!form.quantity_kg || Number(form.quantity_kg) <= 0) {
      setError(t("createListing.err.quantity"));
      return;
    }
    if (!form.price_per_kg || Number(form.price_per_kg) <= 0) {
      setError(t("createListing.err.price"));
      return;
    }
    if (!form.pickup_location.trim()) {
      setError(t("createListing.err.location"));
      return;
    }

    setLoading(true);
    try {
      const payload: ListingCreatePayload = {
        crop_name: form.crop_name.trim(),
        variety: form.variety.trim() || undefined,
        quantity_kg: Number(form.quantity_kg),
        quality_grade: form.quality_grade || undefined,
        price_per_kg: Number(form.price_per_kg),
        harvest_date: form.harvest_date || undefined,
        availability_start: form.availability_start || undefined,
        availability_end: form.availability_end || undefined,
        pickup_location: form.pickup_location.trim(),
        pickup_latitude: form.pickup_latitude ? Number(form.pickup_latitude) : undefined,
        pickup_longitude: form.pickup_longitude ? Number(form.pickup_longitude) : undefined,
        description: form.description.trim() || undefined,
      };
      const created = await createListing(payload);
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createListing.err.generic"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="create-listing-title">
        <div className="modal-head">
          <div>
            <span className="eyebrow">{t("createListing.subtitle")}</span>
            <h2 id="create-listing-title">{t("createListing.title")}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label={t("common.close")}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t("createListing.basicInfo")}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label={t("createListing.cropName")} required>
                <input name="crop_name" value={form.crop_name} onChange={handleChange} placeholder={t("createListing.cropNamePlaceholder")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
              <FormField label={t("createListing.variety")}>
                <input name="variety" value={form.variety} onChange={handleChange} placeholder={t("createListing.varietyPlaceholder")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
              <FormField label={t("createListing.quantity")} required>
                <input name="quantity_kg" type="number" min="1" step="0.01" value={form.quantity_kg} onChange={handleChange} placeholder={t("createListing.quantityPlaceholder")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
              <FormField label={t("createListing.price")} required>
                <input name="price_per_kg" type="number" min="1" step="0.01" value={form.price_per_kg} onChange={handleChange} placeholder={t("createListing.pricePlaceholder")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
            </div>
            <FormField label={t("createListing.qualityGrade")}>
              <select name="quality_grade" value={form.quality_grade} onChange={handleChange} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                <option value="A">{t("createListing.gradeA")}</option>
                <option value="B">{t("createListing.gradeB")}</option>
                <option value="C">{t("createListing.gradeC")}</option>
              </select>
            </FormField>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t("createListing.dates")}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label={t("createListing.harvestDate")}>
                <input name="harvest_date" type="date" value={form.harvest_date} onChange={handleChange} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
              <FormField label={t("createListing.availStart")}>
                <input name="availability_start" type="date" value={form.availability_start} onChange={handleChange} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
              <FormField label={t("createListing.availEnd")}>
                <input name="availability_end" type="date" value={form.availability_end} onChange={handleChange} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t("createListing.location")}</h3>
            <FormField label={t("createListing.pickupLocation")} required>
              <input name="pickup_location" value={form.pickup_location} onChange={handleChange} placeholder={t("createListing.pickupLocationPlaceholder")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label={t("createListing.latitude")}>
                <input name="pickup_latitude" type="number" step="any" value={form.pickup_latitude} onChange={handleChange} placeholder={t("createListing.latitudePlaceholder")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
              <FormField label={t("createListing.longitude")}>
                <input name="pickup_longitude" type="number" step="any" value={form.pickup_longitude} onChange={handleChange} placeholder={t("createListing.longitudePlaceholder")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t("createListing.description")}</h3>
            <FormField label={t("createListing.descriptionLabel")}>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder={t("createListing.descriptionPlaceholder")} className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </FormField>
          </div>

          {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3 border-t pt-5">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t("common.cancel")}</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {t("createListing.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-error">*</span>}
      </span>
      {children}
    </label>
  );
}

function EditListingModal({
  isOpen,
  onClose,
  listing,
  onUpdated,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing | null;
  onUpdated: (listing: Listing) => void;
  t: (key: LocaleKeys) => string;
}) {
  const [form, setForm] = useState({
    crop_name: "",
    variety: "",
    quantity_kg: "",
    quality_grade: "A",
    price_per_kg: "",
    harvest_date: "",
    availability_start: "",
    availability_end: "",
    pickup_location: "",
    pickup_latitude: "",
    pickup_longitude: "",
    description: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && listing) {
      setForm({
        crop_name: listing.crop_name,
        variety: listing.variety || "",
        quantity_kg: String(listing.quantity_kg),
        quality_grade: listing.quality_grade || "A",
        price_per_kg: String(listing.price_per_kg || ""),
        harvest_date: listing.harvest_date || "",
        availability_start: listing.availability_start || "",
        availability_end: listing.availability_end || "",
        pickup_location: listing.pickup_location || "",
        pickup_latitude: listing.pickup_latitude ? String(listing.pickup_latitude) : "",
        pickup_longitude: listing.pickup_longitude ? String(listing.pickup_longitude) : "",
        description: listing.description || "",
        is_active: listing.is_active,
      });
    }
  }, [isOpen, listing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!listing) {
      setError(t("editListing.err.generic"));
      return;
    }
    if (!form.crop_name.trim()) {
      setError(t("editListing.err.cropName"));
      return;
    }
    if (!form.quantity_kg || Number(form.quantity_kg) <= 0) {
      setError(t("editListing.err.quantity"));
      return;
    }
    if (!form.price_per_kg || Number(form.price_per_kg) <= 0) {
      setError(t("editListing.err.price"));
      return;
    }
    if (!form.pickup_location.trim()) {
      setError(t("editListing.err.location"));
      return;
    }

    setLoading(true);
    try {
      const payload: ListingUpdatePayload = {
        crop_name: form.crop_name.trim(),
        variety: form.variety.trim() || undefined,
        quantity_kg: Number(form.quantity_kg),
        quality_grade: form.quality_grade || undefined,
        price_per_kg: Number(form.price_per_kg),
        harvest_date: form.harvest_date || undefined,
        availability_start: form.availability_start || undefined,
        availability_end: form.availability_end || undefined,
        pickup_location: form.pickup_location.trim(),
        pickup_latitude: form.pickup_latitude ? Number(form.pickup_latitude) : undefined,
        pickup_longitude: form.pickup_longitude ? Number(form.pickup_longitude) : undefined,
        description: form.description.trim() || undefined,
        is_active: form.is_active,
      };
      const updated = await updateListing(listing.id, payload);
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("editListing.err.generic"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !listing) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="edit-listing-title">
        <div className="modal-head">
          <div>
            <span className="eyebrow">{t("editListing.subtitle")}</span>
            <h2 id="edit-listing-title">{t("editListing.title")}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label={t("common.close")}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t("editListing.basicInfo")}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label={t("editListing.cropName")} required>
                <input name="crop_name" value={form.crop_name} onChange={handleChange} placeholder={t("editListing.cropNamePlaceholder")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
              <FormField label={t("editListing.variety")}>
                <input name="variety" value={form.variety} onChange={handleChange} placeholder={t("editListing.varietyPlaceholder")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
              <FormField label={t("editListing.quantity")} required>
                <input name="quantity_kg" type="number" min="1" step="0.01" value={form.quantity_kg} onChange={handleChange} placeholder={t("editListing.quantityPlaceholder")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
              <FormField label={t("editListing.price")} required>
                <input name="price_per_kg" type="number" min="1" step="0.01" value={form.price_per_kg} onChange={handleChange} placeholder={t("editListing.pricePlaceholder")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
            </div>
            <FormField label={t("editListing.qualityGrade")}>
              <select name="quality_grade" value={form.quality_grade} onChange={handleChange} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                <option value="A">{t("editListing.gradeA")}</option>
                <option value="B">{t("editListing.gradeB")}</option>
                <option value="C">{t("editListing.gradeC")}</option>
              </select>
            </FormField>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t("editListing.dates")}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label={t("editListing.harvestDate")}>
                <input name="harvest_date" type="date" value={form.harvest_date} onChange={handleChange} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
              <FormField label={t("editListing.availStart")}>
                <input name="availability_start" type="date" value={form.availability_start} onChange={handleChange} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
              <FormField label={t("editListing.availEnd")}>
                <input name="availability_end" type="date" value={form.availability_end} onChange={handleChange} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t("editListing.location")}</h3>
            <FormField label={t("editListing.pickupLocation")} required>
              <input name="pickup_location" value={form.pickup_location} onChange={handleChange} placeholder={t("editListing.pickupLocationPlaceholder")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label={t("editListing.latitude")}>
                <input name="pickup_latitude" type="number" step="any" value={form.pickup_latitude} onChange={handleChange} placeholder={t("editListing.latitudePlaceholder")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
              <FormField label={t("editListing.longitude")}>
                <input name="pickup_longitude" type="number" step="any" value={form.pickup_longitude} onChange={handleChange} placeholder={t("editListing.longitudePlaceholder")} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </FormField>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t("editListing.description")}</h3>
            <FormField label={t("editListing.descriptionLabel")}>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder={t("editListing.descriptionPlaceholder")} className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </FormField>
          </div>

          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <input
              id="edit-listing-active"
              name="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              className="size-4 rounded border-primary text-primary focus:ring-primary"
            />
            <label htmlFor="edit-listing-active" className="text-sm text-muted-foreground">
              {t("editListing.active")}
            </label>
          </div>

          {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3 border-t pt-5">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t("common.cancel")}</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {t("editListing.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated, login, isLoading: authLoading } = useAuth();
  const { t, lang } = useLanguage();
  const [activeNav, setActiveNav] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null);
  const [priceRec, setPriceRec] = useState(null as any);
  const [demandForecast, setDemandForecast] = useState<DemandForecastData | null>(null);
  const [matches, setMatches] = useState<Array<any>>([]);
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentDetailItem | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingStatusData | null>(null);
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createListingModal, setCreateListingModal] = useState(false);
  const [editListingModal, setEditListingModal] = useState(false);
  const [listingToEdit, setListingToEdit] = useState<Listing | null>(null);

  const navItems = [
    { id: "overview", label: t("dash.overview"), icon: LayoutDashboard },
    { id: "marketplace", label: t("dash.marketplace"), icon: Boxes },
    { id: "mylistings", label: t("dash.myListings"), icon: Sprout },
    { id: "orders", label: t("dash.orders"), icon: PackageCheck },
    { id: "routes", label: t("dash.routes"), icon: MapPinned },
  ];

  const activeNavLabel = navItems.find((n) => n.id === activeNav)?.label || t("dash.overview");

  const action = (msg: string) => toast(msg);

  const loadShipmentDetail = async (id: string) => {
    setShipmentLoading(true);
    try {
      const detail = await fetchShipment(id);
      setSelectedShipment(detail);
      const tracking = await fetchTracking(id);
      setTrackingData(tracking);
    } catch (err) {
      console.error("Failed to load shipment detail", err);
    } finally {
      setShipmentLoading(false);
    }
  };

   const loadData = useCallback(async () => {
     if (!isAuthenticated) {
       // Show demo data for screenshots when not authenticated
       setListing({
         id: "listing-1",
         crop_name: "Tomato",
         variety: "Cherry",
         quantity_kg: 500,
         quality_grade: "A",
         price_per_kg: 45,
         pickup_location: "Village Vinchur, Nashik, MH",
         is_active: true,
       });
       setPriceRec({
         recommended_price: 42,
         confidence: 0.87,
         factors: ["comparable_active_listings", "crop_market"],
       });
       setMatches([
         { buyer_id: "priya01", score: 0.92, explanation: { quantity_fit: 0.95, price_score: 0.88, distance_score: 0.90, reliability: 0.95, distance_km: 28, order_history: 12 } },
         { buyer_id: "amit02", score: 0.85, explanation: { quantity_fit: 0.80, price_score: 0.82, distance_score: 0.75, reliability: 0.90, distance_km: 42, order_history: 8 } },
         { buyer_id: "neha03", score: 0.78, explanation: { quantity_fit: 0.70, price_score: 0.85, distance_score: 0.65, reliability: 0.85, distance_km: 61, order_history: 5 } },
       ]);
       setLoading(false);
       return;
     }
     try {
       // 1️⃣ Fetch all listings once (limit 30 is enough for overview + marketplace)
       const all = await fetchListings({ limit: 30 });
       setAllListings(all);
       const active = all.find((l) => l.is_active);
       if (active) {
         setListing(active);

         // 2️⃣ Fire price, forecast, matches in parallel with fallback to demo data
         const [priceRes, forecastRes, matchesRes] = await Promise.allSettled([
           fetchPriceRecommendation(active.id),
           fetchDemandForecast(active.crop_name, active.pickup_location || "India"),
           fetchMatches(active.id, 5),
         ]);
         if (priceRes.status === "fulfilled") setPriceRec(priceRes.value);
         else setPriceRec({ recommended_price: 42, confidence: 0.87, factors: ["comparable_active_listings", "crop_market"] });
         if (forecastRes.status === "fulfilled") setDemandForecast(forecastRes.value);
         else setDemandForecast({ crop: active.crop_name, region: "Nashik, MH", forecast: [{ week: 1, predicted_demand_kg: 450, confidence: 0.82 }, { week: 2, predicted_demand_kg: 480, confidence: 0.79 }] });
         if (matchesRes.status === "fulfilled") setMatches(matchesRes.value);
         else setMatches([
           { buyer_id: "priya01", score: 0.92, explanation: { quantity_fit: 0.95, price_score: 0.88, distance_score: 0.90, reliability: 0.95, distance_km: 28, order_history: 12 } },
           { buyer_id: "amit02", score: 0.85, explanation: { quantity_fit: 0.80, price_score: 0.82, distance_score: 0.75, reliability: 0.90, distance_km: 42, order_history: 8 } },
           { buyer_id: "neha03", score: 0.78, explanation: { quantity_fit: 0.70, price_score: 0.85, distance_score: 0.65, reliability: 0.85, distance_km: 61, order_history: 5 } },
         ]);
       }

       // 3️⃣ Shipments, incoming orders – parallel, non‑blocking
       const [shipRes, ordersRes] = await Promise.allSettled([
         fetchShipments({ limit: 10 }),
         fetchIncomingOrders({ limit: 20 }),
       ]);
       if (shipRes.status === "fulfilled") {
         const shipList = shipRes.value;
         setShipments(shipList);
         if (shipList.length > 0) {
           // load first shipment detail in background
           loadShipmentDetail(shipList[0].id);
         }
       } else {
         // Demo shipment data
         setShipments([{
           id: "shipment-1",
           allocation_id: "alloc-1",
           order_id: "order-1",
           route_id: "route-1",
           vehicle_id: "vehicle-1",
           status: "IN_TRANSIT",
           landed_cost: 25000,
           route_mode: "hub",
           estimated_distance_km: 185.5,
           estimated_duration_min: 210,
           pickup_latitude: 19.9975,
           pickup_longitude: 73.7898,
           drop_latitude: 12.9716,
           drop_longitude: 77.5946,
           pickup_time: "2024-01-20T06:00:00Z",
           delivery_time: "2024-01-21T12:00:00Z",
           created_at: "2024-01-19T14:30:00Z",
           stops: [
             { id: "stop-1", stop_type: "PICKUP", farmer_id: "farmer-1", quantity_kg: 500, sequence: 1, time_window_earliest: "2024-01-20T05:00:00Z", time_window_latest: "2024-01-20T07:00:00Z", latitude: 19.9975, longitude: 73.7898 },
             { id: "stop-2", stop_type: "DROP", buyer_id: "buyer-1", quantity_kg: 500, sequence: 2, time_window_earliest: "2024-01-21T11:00:00Z", time_window_latest: "2024-01-21T13:00:00Z", latitude: 12.9716, longitude: 77.5946 }
           ]
         } as ShipmentItem]);
       }
       if (ordersRes.status === "fulfilled") setIncomingOrders(ordersRes.value);
       else {
         // Demo orders
         setIncomingOrders([{
           id: "order-1",
           buyer_id: "buyer-1",
           status: "CONFIRMED",
           total_amount: 22500,
           delivery_address: "FreshMart Supermarket, Mumbai",
           delivery_deadline: "2024-01-22T10:00:00Z",
           created_at: "2024-01-19T09:15:00Z",
           items: [{ id: "item-1", listing_id: "listing-1", quantity_kg: 500, price_per_kg: 45 }]
         } as OrderResponse]);
       }
     } catch (err) {
       if (err instanceof ApiError) setError(err.message);
       else setError(t("dash.failed"));
     } finally {
       setLoading(false);
     }
   }, [isAuthenticated, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="dash-shell flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{t("dash.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-shell flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3 p-6">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
            <svg className="size-5 text-destructive" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Something went wrong</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
          <Link href="/" className="mt-2 btn btn-sm btn-outline">
            <ArrowLeft className="size-3.5" /> Back to home
          </Link>
        </div>
      </div>
    );
  }

  const shortBuyerId = (id: string) => id.slice(0, 6) + "…";

  const dateLocale = lang === "hi" ? "hi-IN" : lang === "bn" ? "bn-BD" : "en-US";

  return (
    <div className="dash-shell">
      <header className="dash-topbar">
        <div className="dash-topbar-left">
          <Link
            href="/"
            className="btn btn-ghost btn-sm dash-back-link"
            aria-label={t("dash.backToSite")}
            title={t("dash.backToSite")}
          >
            <ArrowLeft size={16} />
            <span>{t("dash.backToSite")}</span>
          </Link>
          <button
            className="btn btn-ghost btn-sm dash-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label={t("common.openMenu")}
          >
            <Menu size={18} />
          </button>
          <div className="breadcrumb">
            <span>{t("dash.workspace")}</span>
            <ChevronRight size={14} />
            <strong>{activeNavLabel}</strong>
          </div>
        </div>
        <div className="dash-topbar-right flex items-center gap-2.5">
          <LanguageSelector variant="dark" />
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => action(t("dash.dataUpdates"))}
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>
          <div className="dash-avatar">
            {user?.full_name?.[0] ?? user?.email?.[0] ?? "U"}
          </div>
        </div>
      </header>

      <div className="dash-body">
        {sidebarOpen && (
          <div
            className="dash-sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside className={`dash-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="dash-nav-label">{t("dash.workspace")}</div>
          <nav className="dash-nav" aria-label="Primary navigation">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`dash-nav-item ${activeNav === id ? "active" : ""}`}
                onClick={() => { setActiveNav(id); setSidebarOpen(false); }}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="dash-nav-label">{t("dash.manage")}</div>
          <nav className="dash-nav" aria-label="Manage navigation">
            <button className="dash-nav-item" onClick={() => action("Team management is coming next.")}>
              <UsersRound size={18} />
              <span>{t("dash.team")}</span>
            </button>
            <button className="dash-nav-item" onClick={() => action("Settings are ready for the next release.")}>
              <Settings2 size={18} />
              <span>{t("dash.settings")}</span>
            </button>
          </nav>
          <div className="dash-sidebar-foot">
            <div className="season-note">
              <CloudSun size={18} />
              <div>
                <strong>{t("dash.rabiSeason")}</strong>
                <span>{t("dash.seasonDay")}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-3">
              <button className="btn btn-sm btn-primary" onClick={() => setCreateListingModal(true)}>
                <FilePlus2 size={16} /> {t("dash.createListing")}
              </button>
              <span className="text-xs text-muted-foreground">{t("dash.needHand")}</span>
            </div>
          </div>
        </aside>

        <main className="dash-main">
          {activeNav === "routes" ? (
            <div className="space-y-6">
              <div className="dash-head">
                <div>
                  <p className="eyebrow">{t("dash.inMotion")} · Google OR-Tools VRP Optimization</p>
                  <h1>{t("dash.routesTitle")}</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {t("dash.routesSub")}
                  </p>
                </div>
                {selectedShipment?.maps_url && (
                  <a
                    href={selectedShipment.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary inline-flex items-center gap-2"
                  >
                    <Navigation size={17} />
                    <span>{t("dash.openGps")}</span>
                  </a>
                )}
              </div>

              {/* Shipment selector tabs */}
              {shipments.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-2 pb-2 border-b">
                    <span className="text-xs font-semibold text-muted-foreground mr-2">{t("dash.shipments")}</span>
                    {shipments.map((s, idx) => (
                      <button
                        key={s.id}
                        onClick={() => loadShipmentDetail(s.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                          selectedShipment?.id === s.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground hover:bg-muted"
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{t("dash.shipment")} #{idx + 1} ({s.status})</span>
                      </button>
                    ))}
                  </div>

                  {shipmentLoading ? (
                    <div className="p-8 flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="size-5 animate-spin" />
                      <span className="text-sm">{t("dash.loadingRoute")}</span>
                    </div>
                  ) : selectedShipment ? (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      <div className="xl:col-span-2 space-y-6">
                        <RouteMap
                          stops={selectedShipment.stops || []}
                          vehicle={selectedShipment.vehicle}
                          distanceKm={selectedShipment.estimated_distance_km}
                          durationMin={selectedShipment.estimated_duration_min}
                          routeMode={selectedShipment.route_mode || "direct"}
                          mapsUrl={selectedShipment.maps_url}
                        />
                      </div>
                      <div className="space-y-6">
                        <TrackingTimeline
                          shipmentId={selectedShipment.id}
                          currentStatus={selectedShipment.status}
                          events={trackingData?.events || []}
                          estimatedArrival={trackingData?.estimated_arrival || selectedShipment.delivery_time}
                          currentLat={trackingData?.current_latitude}
                          currentLng={trackingData?.current_longitude}
                          onRefresh={() => loadShipmentDetail(selectedShipment.id)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="card p-6 text-center text-muted-foreground">
                      {t("dash.selectShipment")}
                    </div>
                  )}
                </div>
              ) : (
                <div className="card p-8 text-center space-y-3">
                  <Truck className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="font-semibold text-lg text-foreground">{t("dash.noRoutes")}</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t("dash.noRoutesBody")}
                  </p>
                </div>
              )}
            </div>
          ) : activeNav === "marketplace" ? (
            <div className="space-y-6">
              <div className="dash-head">
                <div>
                  <p className="eyebrow">{t("dash.liveMarket")}</p>
                  <h1>{t("dash.marketplace")}</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {t("dash.marketplaceSub")}
                  </p>
                </div>
                <Link href="/marketplace" className="btn btn-primary inline-flex items-center gap-2">
                  <ArrowUpRight size={17} /> {t("dash.openMarketplace")}
                </Link>
              </div>

              {allListings.length > 0 ? (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>{t("dash.colCrop")}</th>
                          <th>{t("dash.colQty")}</th>
                          <th>{t("dash.colPrice")}</th>
                          <th>{t("dash.colGrade")}</th>
                          <th>{t("dash.colLocation")}</th>
                          <th className="text-right">{t("dash.colStatus")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allListings.map((l) => (
                          <tr key={l.id}>
                            <td className="font-medium">
                              {l.crop_name}
                              {l.variety ? ` · ${l.variety}` : ""}
                            </td>
                            <td>{l.quantity_kg} kg</td>
                            <td>{l.price_per_kg ? `₹${l.price_per_kg}/kg` : "—"}</td>
                            <td>{l.quality_grade ?? "—"}</td>
                            <td>{l.pickup_location ?? "—"}</td>
                            <td className="text-right">
                              <Link href={`/listing/${l.id}`} className="text-link inline-flex items-center gap-1">
                                {t("dash.viewListing")} <ArrowUpRight size={14} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card p-8 text-center space-y-3">
                  <Boxes className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="font-semibold text-lg text-foreground">{t("dash.emptyMarketplace")}</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t("dash.emptyMarketplaceBody")}
                  </p>
                </div>
              )}
            </div>
          ) : activeNav === "mylistings" ? (
            <div className="space-y-6">
              <div className="dash-head">
                <div>
                  <p className="eyebrow">{t("dash.liveMarket")}</p>
                  <h1>{t("dash.myListings")}</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {t("dash.myListingsSub")}
                  </p>
                </div>
                <Link href="/create-listing" className="btn btn-primary">
                  <FilePlus2 size={17} /> {t("dash.createListing")}
                </Link>
              </div>

              {allListings.filter((l) => l.seller_id === user?.id).length > 0 ? (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>{t("dash.colCrop")}</th>
                          <th>{t("dash.colQty")}</th>
                          <th>{t("dash.colPrice")}</th>
                          <th>{t("dash.colGrade")}</th>
                          <th>{t("dash.colLocation")}</th>
                          <th className="text-right">{t("dash.colStatus")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allListings
                          .filter((l) => l.seller_id === user?.id)
                          .map((l) => (
                            <tr key={l.id}>
                              <td className="font-medium">
                                {l.crop_name}
                                {l.variety ? ` · ${l.variety}` : ""}
                              </td>
                              <td>{l.quantity_kg} kg</td>
                              <td>{l.price_per_kg ? `₹${l.price_per_kg}/kg` : "—"}</td>
                              <td>{l.quality_grade ?? "—"}</td>
                              <td>{l.pickup_location ?? "—"}</td>
                              <td className="text-right">
                                <span className={`badge ${l.is_active ? "badge-primary" : "badge-neutral"}`}>
                                  {l.is_active ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="text-right">
                                <button
                                  className="btn btn-ghost btn-sm text-link edit-listing-btn"
                                  onClick={() => {
                                    setListingToEdit(l);
                                    setEditListingModal(true);
                                  }}
                                  aria-label={`Edit listing ${l.id}`}
                                >
                                  <Edit size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card p-8 text-center space-y-3">
                  <Sprout className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="font-semibold text-lg text-foreground">{t("dash.emptyListings")}</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t("dash.emptyListingsBody")}
                  </p>
                </div>
              )}
            </div>
          ) : activeNav === "orders" ? (
            <div className="space-y-6">
              <div className="dash-head">
                <div>
                  <p className="eyebrow">{t("dash.liveMarket")}</p>
                  <h1>{t("dash.orders")}</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {t("dash.ordersSub")}
                  </p>
                </div>
              </div>

              {incomingOrders.length > 0 ? (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>{t("dash.colOrder")}</th>
                          <th>{t("dash.colStatus")}</th>
                          <th>{t("dash.colItems")}</th>
                          <th>{t("dash.colTotal")}</th>
                          <th>{t("dash.colPlaced")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incomingOrders.map((o) => (
                          <tr key={o.id}>
                            <td className="font-mono text-xs">#{o.id.slice(0, 8)}</td>
                            <td>
                              <span className={`badge ${o.status === "PENDING" ? "badge-warning" : "badge-primary"}`}>
                                {o.status}
                              </span>
                            </td>
                            <td>
                              {o.items.map((i) => `${i.quantity_kg} kg`).join(", ")}
                            </td>
                            <td>{o.total_amount != null ? `₹${o.total_amount.toFixed(2)}` : "—"}</td>
                            <td>{new Date(o.created_at).toLocaleDateString(dateLocale)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card p-8 text-center space-y-3">
                  <PackageCheck className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="font-semibold text-lg text-foreground">{t("dash.noOrders")}</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t("dash.noOrdersBody")}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="dash-head">
                <div>
                  <p className="eyebrow">{new Date().toLocaleDateString(dateLocale, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {t("dash.liveMarket")}</p>
                  <h1>{t("dash.goodMorning")}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}.</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {t("dash.supplyNext")}
                  </p>
                  {!isAuthenticated && (
                    <span className="badge badge-warning mt-2 inline-block">Demo Data — Sign in for real data</span>
                  )}
                </div>
                <Link href="/create-listing" className="btn btn-primary">
                  <FilePlus2 size={17} /> {t("dash.newListing")}
                </Link>
              </div>

              {/* Market intelligence – price recommendation */}
              <section className="intel">
                {priceRec ? (
                  <div className="card intel-card">
                    <h3>{listing?.crop_name ?? "Crop"} · {listing?.variety ?? ""}</h3>
                    <div className="intel-current">
                      <strong>
                        {priceRec.recommended_price ? `₹${priceRec.recommended_price.toFixed(2)}` : "—"}
                      </strong>
                      <span>{t("dash.recPrice")}</span>
                    </div>
                    <p className="intel-recommended">
                      {priceRec.factors?.length ? `${t("dash.basedOn")} ${priceRec.factors.join(", ")}.` : t("dash.priceBand")}
                    </p>
                    <div className="intel-factors">
                      <span className="badge badge-primary">{t("dash.confidence")} {priceRec.confidence ?? "?"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="card intel-card">
                    <p>{t("dash.noPriceRec")}</p>
                  </div>
                )}
              </section>

              {/* Demand forecast */}
              <section className="intel">
                {demandForecast && !demandForecast.message ? (
                  <div className="card intel-card">
                    <h3>{demandForecast.crop} · {demandForecast.region}</h3>
                    <div className="intel-current">
                      <strong>
                        {demandForecast.forecast?.length > 0
                          ? `${demandForecast.forecast[0].predicted_demand_kg.toFixed(0)} kg`
                          : "—"}
                      </strong>
                      <span>{t("dash.nextWeekDemand")}</span>
                    </div>
                    <p className="intel-recommended">
                      {demandForecast.forecast?.map((f, i) => (
                        <span key={i}>
                          Week {f.week}: {f.predicted_demand_kg.toFixed(0)} kg
                          {i < demandForecast.forecast!.length - 1 ? " · " : ""}
                        </span>
                      )) ?? "—"}
                    </p>
                    <div className="intel-factors">
                      <span className="badge badge-primary">
                        {t("dash.confidence")} {demandForecast.forecast?.[0]?.confidence ?? "?"}
                      </span>
                      <span className="badge badge-neutral ml-2">
                        {t("dash.historicalData")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="card intel-card">
                    <p>
                      {demandForecast?.message || t("dash.noDemandForecast")}
                    </p>
                  </div>
                )}
              </section>

              {/* Recommended listing */}
              <section className="dash-section">
                <div className="dash-section-head">
                  <div>
                    <span className="eyebrow">{t("dash.decisionLayer")}</span>
                    <h2>{t("dash.whatMove")}</h2>
                  </div>
                  <button className="text-link" onClick={() => action("All opportunities are already ranked by fit.")}>{t("dash.viewAll")} <ArrowUpRight size={15} /></button>
                </div>
                {listing && (
                  <div className="card">
                    <div className="recommendation-top">
                      <div className="crop-badge">{listing.crop_name?.[0] ?? "C"}</div>
                      <div className="recommendation-title">
                        <div className="card-label">{t("dash.recListing")}</div>
                        <h3>{listing.crop_name} <span>· {listing.quality_grade ?? ""}</span></h3>
                        <p>{listing.pickup_location ?? t("marketplace.locationTBA")}</p>
                      </div>
                      <span className="badge badge-primary">{t("dash.highOpp")}</span>
                    </div>
                    <div className="recommendation-metrics">
                      <div><span>{t("dash.available")}</span><strong>{listing.quantity_kg} kg</strong></div>
                      <div><span>{t("dash.recommendedPrice")}</span><strong>{priceRec?.recommended_price ? `₹${priceRec.recommended_price}/kg` : "—"}</strong></div>
                    </div>
                    <div className="recommendation-bottom">
                      <div className="reason-copy">
                        <ShieldCheck size={16} />
                        <span><b>{t("dash.whyPrice")}</b> {t("dash.whyPriceDesc")}</span>
                        <button className="why-button" onClick={() => setShowWhy(!showWhy)}>
                          {showWhy ? t("dash.hide") : t("dash.seeWhy")}
                        </button>
                      </div>
                    </div>
                    {showWhy && (
                      <div className="why-panel">
                        <div><strong>{t("dash.confidence")}</strong><span>{priceRec?.confidence ?? "?"}</span></div>
                        <div><strong>{t("dash.factors")}</strong><span>{priceRec?.factors?.join(", ") ?? "—"}</span></div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Buyer matching */}
              <section className="dash-section">
                <div className="dash-section-head">
                  <div>
                    <span className="eyebrow">{t("dash.buyerMatching")}</span>
                    <h2>{t("dash.bestMatches")}</h2>
                  </div>
                  <button className="text-link" onClick={() => action("Matching preferences opened.")}>{t("dash.tuneMatching")} <Settings2 size={14} /></button>
                </div>
                <div className="card">
                  {matches.map((m) => (
                    <div className="match-row" key={m.buyer_id}>
                      <div className="match-avatar">{shortBuyerId(m.buyer_id)}</div>
                      <div className="match-main"><strong>{shortBuyerId(m.buyer_id)}</strong><span>{m.explanation?.distance_km ? `${m.explanation.distance_km} km` : ""}</span></div>
                      <div className="match-cell"><span>{t("dash.score")}</span><strong>{Math.round(m.score * 100)}%</strong></div>
                      <div className="match-score">
                        <SignalBars value={Math.round(m.score * 100)} tone="green" />
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => action(`Match ${shortBuyerId(m.buyer_id)} opened.`)} aria-label={`Open match ${shortBuyerId(m.buyer_id)}`}>
                        <ArrowUpRight size={16} />
                      </button>
                    </div>
                  ))}
                  <div className="p-4 border-t border-border">
                    <button className="btn btn-secondary btn-block" onClick={() => action("Marketplace opened with matches.")}>
                      {t("dash.exploreMarketplace")} <ArrowUpRight size={15} />
                    </button>
                  </div>
                </div>
              </section>

              {/* Live operations – real shipment status */}
              <section className="dash-section">
                <div className="dash-section-head">
                  <div>
                    <span className="eyebrow">{t("dash.inMotion")}</span>
                    <h2>{t("dash.liveOps")}</h2>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => { loadData(); action("Operations refreshed."); }} aria-label="Refresh operations">
                    <BarChart3 size={17} />
                  </button>
                </div>
                {shipments.length > 0 ? (
                  <div className="card p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <Truck size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">
                            {t("dash.activeShipment")} ({shipments[0].route_mode?.toUpperCase() || "DIRECT"})
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {shipments[0].estimated_distance_km ? t("dash.totalDistance").replace("{km}", String(shipments[0].estimated_distance_km)) : t("dash.routeDispatched")}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {shipments[0].status}
                      </span>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        className="btn btn-secondary btn-sm flex items-center gap-1.5"
                        onClick={() => setActiveNav("routes")}
                      >
                        <span>{t("dash.viewRoute")}</span>
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="card">
                    <p className="state-body">{t("dash.noActiveShipments")}</p>
                  </div>
                )}
              </section>
            </>
          )}

          <footer className="footer-note">
            <span><Sprout size={14} /> {t("dash.footerBuilt")}</span>
            <span>
              {t("dash.dataUpdates")} <button className="text-link" onClick={() => action("System status: all services operational.")}>{t("dash.systemStatus")}</button>
            </span>
          </footer>
        </main>
        <CreateListingModal
          isOpen={createListingModal}
          onClose={() => setCreateListingModal(false)}
          onCreated={(newListing) => {
            setAllListings((prev) => [newListing, ...prev]);
            setListing(newListing);
            setCreateListingModal(false);
            toast.success(t("createListing.success"));
          }}
          t={t}
        />
        <EditListingModal
          isOpen={editListingModal}
          onClose={() => { setEditListingModal(false); setListingToEdit(null); }}
          listing={listingToEdit}
          onUpdated={(updatedListing) => {
            setAllListings((prev) => prev.map((l) => (l.id === updatedListing.id ? updatedListing : l)));
            setListing((prev) => (prev?.id === updatedListing.id ? updatedListing : prev));
            setListingToEdit(null);
            setEditListingModal(false);
            toast.success(t("editListing.success"));
          }}
          t={t}
        />
      </div>
    </div>
  );
}
