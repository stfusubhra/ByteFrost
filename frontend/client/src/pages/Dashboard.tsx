/* KisanSetu Field Ledger – core product dashboard.
 * This component now fetches real data from the backend:
 *   - Active listings for the logged-in farmer
 *   - Price recommendation for the selected listing
 *   - Demand forecast for the active crop
 *   - Buyer matching scores (real API)
 * The UI falls back to a friendly empty state when no data is available.
 *
 * UI: shadcn/ui primitives (Card, Table, Badge, Dialog, Tabs, Progress…).
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ────────────────────────────────────────────────────────────
 * Create Listing modal (shadcn Dialog)
 * ──────────────────────────────────────────────────────────── */
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("createListing.title")}</DialogTitle>
          <DialogDescription>{t("createListing.subtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("createListing.basicInfo")}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cl-crop_name">
                  {t("createListing.cropName")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cl-crop_name"
                  name="crop_name"
                  value={form.crop_name}
                  onChange={handleChange}
                  placeholder={t("createListing.cropNamePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-variety">{t("createListing.variety")}</Label>
                <Input
                  id="cl-variety"
                  name="variety"
                  value={form.variety}
                  onChange={handleChange}
                  placeholder={t("createListing.varietyPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-quantity">
                  {t("createListing.quantity")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cl-quantity"
                  name="quantity_kg"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.quantity_kg}
                  onChange={handleChange}
                  placeholder={t("createListing.quantityPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-price">
                  {t("createListing.price")} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="cl-price"
                    name="price_per_kg"
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.price_per_kg}
                    onChange={handleChange}
                    placeholder={t("createListing.pricePlaceholder")}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("createListing.qualityGrade")}</Label>
                <Select
                  value={form.quality_grade}
                  onValueChange={(value) => {
                    setForm((prev) => ({ ...prev, quality_grade: value }));
                    setError(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("createListing.qualityGrade")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">{t("createListing.gradeA")}</SelectItem>
                    <SelectItem value="B">{t("createListing.gradeB")}</SelectItem>
                    <SelectItem value="C">{t("createListing.gradeC")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("createListing.dates")}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cl-harvest">{t("createListing.harvestDate")}</Label>
                <Input id="cl-harvest" name="harvest_date" type="date" value={form.harvest_date} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-avail-start">{t("createListing.availStart")}</Label>
                <Input id="cl-avail-start" name="availability_start" type="date" value={form.availability_start} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-avail-end">{t("createListing.availEnd")}</Label>
                <Input id="cl-avail-end" name="availability_end" type="date" value={form.availability_end} onChange={handleChange} />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("createListing.location")}</h3>
            <div className="space-y-2">
              <Label htmlFor="cl-pickup">
                {t("createListing.pickupLocation")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cl-pickup"
                name="pickup_location"
                value={form.pickup_location}
                onChange={handleChange}
                placeholder={t("createListing.pickupLocationPlaceholder")}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cl-lat">{t("createListing.latitude")}</Label>
                <Input
                  id="cl-lat"
                  name="pickup_latitude"
                  type="number"
                  step="any"
                  value={form.pickup_latitude}
                  onChange={handleChange}
                  placeholder={t("createListing.latitudePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cl-lng">{t("createListing.longitude")}</Label>
                <Input
                  id="cl-lng"
                  name="pickup_longitude"
                  type="number"
                  step="any"
                  value={form.pickup_longitude}
                  onChange={handleChange}
                  placeholder={t("createListing.longitudePlaceholder")}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("createListing.description")}</h3>
            <div className="space-y-2">
              <Label htmlFor="cl-desc">{t("createListing.descriptionLabel")}</Label>
              <Textarea
                id="cl-desc"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder={t("createListing.descriptionPlaceholder")}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {t("createListing.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────────────────────────────────────────────
 * Edit Listing modal (shadcn Dialog)
 * ──────────────────────────────────────────────────────────── */
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
        harvest_date: listing.harvest_date ? new Date(listing.harvest_date).toISOString().split("T")[0] : "",
        availability_start: listing.availability_start ? new Date(listing.availability_start).toISOString().split("T")[0] : "",
        availability_end: listing.availability_end ? new Date(listing.availability_end).toISOString().split("T")[0] : "",
        pickup_location: listing.pickup_location || "",
        pickup_latitude: listing.pickup_latitude ? String(listing.pickup_latitude) : "",
        pickup_longitude: listing.pickup_longitude ? String(listing.pickup_longitude) : "",
        description: listing.description || "",
        is_active: listing.is_active,
      });
    }
  }, [isOpen, listing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("editListing.title")}</DialogTitle>
          <DialogDescription>{t("editListing.subtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("editListing.basicInfo")}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="el-crop_name">
                  {t("editListing.cropName")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="el-crop_name"
                  name="crop_name"
                  value={form.crop_name}
                  onChange={handleChange}
                  placeholder={t("editListing.cropNamePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="el-variety">{t("editListing.variety")}</Label>
                <Input
                  id="el-variety"
                  name="variety"
                  value={form.variety}
                  onChange={handleChange}
                  placeholder={t("editListing.varietyPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="el-quantity">
                  {t("editListing.quantity")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="el-quantity"
                  name="quantity_kg"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.quantity_kg}
                  onChange={handleChange}
                  placeholder={t("editListing.quantityPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="el-price">
                  {t("editListing.price")} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="el-price"
                    name="price_per_kg"
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.price_per_kg}
                    onChange={handleChange}
                    placeholder={t("editListing.pricePlaceholder")}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("editListing.qualityGrade")}</Label>
                <Select
                  value={form.quality_grade}
                  onValueChange={(value) => {
                    setForm((prev) => ({ ...prev, quality_grade: value }));
                    setError(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("editListing.qualityGrade")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">{t("editListing.gradeA")}</SelectItem>
                    <SelectItem value="B">{t("editListing.gradeB")}</SelectItem>
                    <SelectItem value="C">{t("editListing.gradeC")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("editListing.dates")}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="el-harvest">{t("editListing.harvestDate")}</Label>
                <Input id="el-harvest" name="harvest_date" type="date" value={form.harvest_date} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="el-avail-start">{t("editListing.availStart")}</Label>
                <Input id="el-avail-start" name="availability_start" type="date" value={form.availability_start} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="el-avail-end">{t("editListing.availEnd")}</Label>
                <Input id="el-avail-end" name="availability_end" type="date" value={form.availability_end} onChange={handleChange} />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("editListing.location")}</h3>
            <div className="space-y-2">
              <Label htmlFor="el-pickup">
                {t("editListing.pickupLocation")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="el-pickup"
                name="pickup_location"
                value={form.pickup_location}
                onChange={handleChange}
                placeholder={t("editListing.pickupLocationPlaceholder")}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="el-lat">{t("editListing.latitude")}</Label>
                <Input
                  id="el-lat"
                  name="pickup_latitude"
                  type="number"
                  step="any"
                  value={form.pickup_latitude}
                  onChange={handleChange}
                  placeholder={t("editListing.latitudePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="el-lng">{t("editListing.longitude")}</Label>
                <Input
                  id="el-lng"
                  name="pickup_longitude"
                  type="number"
                  step="any"
                  value={form.pickup_longitude}
                  onChange={handleChange}
                  placeholder={t("editListing.longitudePlaceholder")}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("editListing.description")}</h3>
            <div className="space-y-2">
              <Label htmlFor="el-desc">{t("editListing.descriptionLabel")}</Label>
              <Textarea
                id="el-desc"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder={t("editListing.descriptionPlaceholder")}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5">
            <Checkbox
              id="el-active"
              checked={form.is_active}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: !!checked }))}
            />
            <Label htmlFor="el-active" className="text-sm text-muted-foreground">
              {t("editListing.active")}
            </Label>
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {t("editListing.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ────────────────────────────────────────────────────────────
 * Dashboard shell
 * ──────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
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
        seller_id: "demo",
        crop_name: "Tomato",
        variety: "Cherry",
        quantity_kg: 500,
        quality_grade: "A",
        price_per_kg: 45,
        pickup_location: "Village Vinchur, Nashik, MH",
        harvest_date: null,
        is_active: true,
        created_at: new Date().toISOString(),
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
      <div className="dash-shell flex min-h-screen items-center justify-center">
        <div className="flex w-full max-w-md flex-col gap-4 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-shell flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md p-6 text-center">
          <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-destructive/10">
            <svg className="size-5 text-destructive" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h2 className="text-base font-semibold text-foreground">Something went wrong</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/">
              <ArrowLeft className="size-3.5" /> Back to home
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const shortBuyerId = (id: string) => id.slice(0, 6) + "…";

  const dateLocale = lang === "hi" ? "hi-IN" : lang === "bn" ? "bn-BD" : "en-US";

  const statusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "PENDING") return <Badge variant="secondary">{status}</Badge>;
    if (s === "CONFIRMED" || s === "IN_TRANSIT") return <Badge>{status}</Badge>;
    if (s === "CANCELLED" || s === "FAILED") return <Badge variant="destructive">{status}</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="dash-shell">
      <header className="dash-topbar">
        <div className="dash-topbar-left">
          <Button variant="ghost" size="sm" className="dash-back-link" asChild>
            <Link href="/" aria-label={t("dash.backToSite")} title={t("dash.backToSite")}>
              <ArrowLeft className="size-4" />
              <span>{t("dash.backToSite")}</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="dash-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label={t("common.openMenu")}
          >
            <Menu className="size-[18px]" />
          </Button>
          <div className="breadcrumb">
            <span>{t("dash.workspace")}</span>
            <ChevronRight className="size-3.5" />
            <strong>{activeNavLabel}</strong>
          </div>
        </div>
        <div className="dash-topbar-right flex items-center gap-2.5">
          <LanguageSelector variant="dark" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => action(t("dash.dataUpdates"))}
            aria-label="Notifications"
          >
            <Bell className="size-[18px]" />
          </Button>
          <Avatar className="dash-avatar size-8">
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {user?.full_name?.[0] ?? user?.email?.[0] ?? "U"}
            </AvatarFallback>
          </Avatar>
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
                <Icon className="size-[18px]" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="dash-nav-label">{t("dash.manage")}</div>
          <nav className="dash-nav" aria-label="Manage navigation">
            <button className="dash-nav-item" onClick={() => action("Team management is coming next.")}>
              <UsersRound className="size-[18px]" />
              <span>{t("dash.team")}</span>
            </button>
            <button className="dash-nav-item" onClick={() => action("Settings are ready for the next release.")}>
              <Settings2 className="size-[18px]" />
              <span>{t("dash.settings")}</span>
            </button>
          </nav>
          <div className="dash-sidebar-foot">
            <div className="season-note">
              <CloudSun className="size-[18px]" />
              <div>
                <strong>{t("dash.rabiSeason")}</strong>
                <span>{t("dash.seasonDay")}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-3">
              <Button size="sm" onClick={() => setCreateListingModal(true)}>
                <FilePlus2 className="size-4" /> {t("dash.createListing")}
              </Button>
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
                  <Button asChild>
                    <a
                      href={selectedShipment.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      <Navigation className="size-4" />
                      <span>{t("dash.openGps")}</span>
                    </a>
                  </Button>
                )}
              </div>

              {shipments.length > 0 ? (
                <div className="space-y-6">
                  <Tabs
                    value={selectedShipment?.id ?? shipments[0]?.id}
                    onValueChange={(v) => loadShipmentDetail(v)}
                  >
                    <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                      {shipments.map((s, idx) => (
                        <TabsTrigger
                          key={s.id}
                          value={s.id}
                          className="gap-1.5 border data-[state=active]:border-primary"
                        >
                          <Truck className="size-3.5" />
                          <span>{t("dash.shipment")} #{idx + 1} ({s.status})</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <TabsContent value={selectedShipment?.id ?? ""} className="mt-6">
                      {shipmentLoading ? (
                        <div className="flex flex-col items-center gap-2 p-8 text-muted-foreground">
                          <Loader2 className="size-5 animate-spin" />
                          <span className="text-sm">{t("dash.loadingRoute")}</span>
                        </div>
                      ) : selectedShipment ? (
                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                          <div className="space-y-6 xl:col-span-2">
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
                        <Card className="p-6 text-center text-muted-foreground">
                          {t("dash.selectShipment")}
                        </Card>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <div className="space-y-3">
                    <Truck className="mx-auto size-10 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground">{t("dash.noRoutes")}</h3>
                    <p className="mx-auto max-w-md text-sm text-muted-foreground">
                      {t("dash.noRoutesBody")}
                    </p>
                  </div>
                </Card>
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
                <Button asChild>
                  <Link href="/marketplace" className="inline-flex items-center gap-2">
                    <ArrowUpRight className="size-4" /> {t("dash.openMarketplace")}
                  </Link>
                </Button>
              </div>

              {allListings.length > 0 ? (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("dash.colCrop")}</TableHead>
                        <TableHead>{t("dash.colQty")}</TableHead>
                        <TableHead>{t("dash.colPrice")}</TableHead>
                        <TableHead>{t("dash.colGrade")}</TableHead>
                        <TableHead>{t("dash.colLocation")}</TableHead>
                        <TableHead className="text-right">{t("dash.colStatus")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allListings.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">
                            {l.crop_name}
                            {l.variety ? ` · ${l.variety}` : ""}
                          </TableCell>
                          <TableCell>{l.quantity_kg} kg</TableCell>
                          <TableCell>{l.price_per_kg ? `₹${l.price_per_kg}/kg` : "—"}</TableCell>
                          <TableCell>{l.quality_grade ?? "—"}</TableCell>
                          <TableCell>{l.pickup_location ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="link" size="sm" className="h-auto p-0" asChild>
                              <Link href={`/listing/${l.id}`} className="inline-flex items-center gap-1">
                                {t("dash.viewListing")} <ArrowUpRight className="size-3.5" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <div className="space-y-3">
                    <Boxes className="mx-auto size-10 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground">{t("dash.emptyMarketplace")}</h3>
                    <p className="mx-auto max-w-md text-sm text-muted-foreground">
                      {t("dash.emptyMarketplaceBody")}
                    </p>
                  </div>
                </Card>
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
                <Button asChild>
                  <Link href="/create-listing">
                    <FilePlus2 className="size-4" /> {t("dash.createListing")}
                  </Link>
                </Button>
              </div>

              {allListings.filter((l) => l.seller_id === user?.id).length > 0 ? (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("dash.colCrop")}</TableHead>
                        <TableHead>{t("dash.colQty")}</TableHead>
                        <TableHead>{t("dash.colPrice")}</TableHead>
                        <TableHead>{t("dash.colGrade")}</TableHead>
                        <TableHead>{t("dash.colLocation")}</TableHead>
                        <TableHead>{t("dash.colStatus")}</TableHead>
                        <TableHead className="text-right">{t("dash.colStatus")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allListings
                        .filter((l) => l.seller_id === user?.id)
                        .map((l) => (
                          <TableRow key={l.id}>
                            <TableCell className="font-medium">
                              {l.crop_name}
                              {l.variety ? ` · ${l.variety}` : ""}
                            </TableCell>
                            <TableCell>{l.quantity_kg} kg</TableCell>
                            <TableCell>{l.price_per_kg ? `₹${l.price_per_kg}/kg` : "—"}</TableCell>
                            <TableCell>{l.quality_grade ?? "—"}</TableCell>
                            <TableCell>{l.pickup_location ?? "—"}</TableCell>
                            <TableCell>
                              {l.is_active ? (
                                <Badge>{t("dash.active")}</Badge>
                              ) : (
                                <Badge variant="secondary">{t("dash.inactive")}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-primary"
                                onClick={() => {
                                  setListingToEdit(l);
                                  setEditListingModal(true);
                                }}
                                aria-label={`Edit listing ${l.id}`}
                              >
                                <Edit className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <div className="space-y-3">
                    <Sprout className="mx-auto size-10 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground">{t("dash.emptyListings")}</h3>
                    <p className="mx-auto max-w-md text-sm text-muted-foreground">
                      {t("dash.emptyListingsBody")}
                    </p>
                  </div>
                </Card>
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
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("dash.colOrder")}</TableHead>
                        <TableHead>{t("dash.colStatus")}</TableHead>
                        <TableHead>{t("dash.colItems")}</TableHead>
                        <TableHead>{t("dash.colTotal")}</TableHead>
                        <TableHead>{t("dash.colPlaced")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomingOrders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono text-xs">#{o.id.slice(0, 8)}</TableCell>
                          <TableCell>{statusBadge(o.status)}</TableCell>
                          <TableCell>
                            {o.items.map((i) => `${i.quantity_kg} kg`).join(", ")}
                          </TableCell>
                          <TableCell>{o.total_amount != null ? `₹${o.total_amount.toFixed(2)}` : "—"}</TableCell>
                          <TableCell>{new Date(o.created_at).toLocaleDateString(dateLocale)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <div className="space-y-3">
                    <PackageCheck className="mx-auto size-10 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground">{t("dash.noOrders")}</h3>
                    <p className="mx-auto max-w-md text-sm text-muted-foreground">
                      {t("dash.noOrdersBody")}
                    </p>
                  </div>
                </Card>
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
                    <Badge variant="secondary" className="mt-2">Demo Data — Sign in for real data</Badge>
                  )}
                </div>
                <Button asChild>
                  <Link href="/create-listing">
                    <FilePlus2 className="size-4" /> {t("dash.newListing")}
                  </Link>
                </Button>
              </div>

              {/* Market intelligence – price recommendation + demand forecast */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                      <BarChart3 className="size-4.5 text-primary" />
                    </div>
                    <CardTitle className="text-base">
                      {listing?.crop_name ?? "Crop"}{listing?.variety ? ` · ${listing.variety}` : ""}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {priceRec ? (
                      <div className="space-y-3">
                        <div>
                          <div className="text-3xl font-bold tracking-tight text-foreground">
                            {priceRec.recommended_price ? `₹${priceRec.recommended_price.toFixed(2)}` : "—"}
                          </div>
                          <p className="text-sm text-muted-foreground">{t("dash.recPrice")}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {priceRec.factors?.length ? `${t("dash.basedOn")} ${priceRec.factors.join(", ")}.` : t("dash.priceBand")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            {t("dash.confidence")} {priceRec.confidence != null ? `${Math.round(priceRec.confidence * 100)}%` : "?"}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("dash.noPriceRec")}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                      <Sprout className="size-4.5 text-primary" />
                    </div>
                    <CardTitle className="text-base">
                      {demandForecast?.crop ?? "Crop"}{demandForecast?.region ? ` · ${demandForecast.region}` : ""}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {demandForecast && !demandForecast.message ? (
                      <div className="space-y-3">
                        <div>
                          <div className="text-3xl font-bold tracking-tight text-foreground">
                            {demandForecast.forecast?.length > 0
                              ? `${demandForecast.forecast[0].predicted_demand_kg.toFixed(0)} kg`
                              : "—"}
                          </div>
                          <p className="text-sm text-muted-foreground">{t("dash.nextWeekDemand")}</p>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {demandForecast.forecast?.map((f, i) => (
                            <span key={i}>
                              Week {f.week}: {f.predicted_demand_kg.toFixed(0)} kg
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            {t("dash.confidence")} {demandForecast.forecast?.[0]?.confidence != null ? `${Math.round(demandForecast.forecast[0].confidence * 100)}%` : "?"}
                          </Badge>
                          <Badge variant="outline">{t("dash.historicalData")}</Badge>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {demandForecast?.message || t("dash.noDemandForecast")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recommended listing */}
              <section className="dash-section">
                <div className="dash-section-head">
                  <div>
                    <span className="eyebrow">{t("dash.decisionLayer")}</span>
                    <h2>{t("dash.whatMove")}</h2>
                  </div>
                  <Button variant="link" size="sm" className="text-primary" onClick={() => action("All opportunities are already ranked by fit.")}>
                    {t("dash.viewAll")} <ArrowUpRight className="size-3.5" />
                  </Button>
                </div>
                {listing && (
                  <Card>
                    <CardContent className="space-y-4 p-6">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                          {listing.crop_name?.[0] ?? "C"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {t("dash.recListing")}
                          </p>
                          <h3 className="truncate text-lg font-semibold text-foreground">
                            {listing.crop_name} {listing.quality_grade ? <span className="text-muted-foreground">· {listing.quality_grade}</span> : null}
                          </h3>
                          <p className="truncate text-sm text-muted-foreground">
                            {listing.pickup_location ?? t("marketplace.locationTBA")}
                          </p>
                        </div>
                        <Badge>{t("dash.highOpp")}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg border bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground">{t("dash.available")}</p>
                          <p className="mt-0.5 text-lg font-semibold text-foreground">{listing.quantity_kg} kg</p>
                        </div>
                        <div className="rounded-lg border bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground">{t("dash.recommendedPrice")}</p>
                          <p className="mt-0.5 text-lg font-semibold text-foreground">
                            {priceRec?.recommended_price ? `₹${priceRec.recommended_price}/kg` : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
                        <ShieldCheck className="size-4 shrink-0 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          <b className="text-foreground">{t("dash.whyPrice")}</b> {t("dash.whyPriceDesc")}
                        </span>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-primary"
                          onClick={() => setShowWhy(!showWhy)}
                        >
                          {showWhy ? t("dash.hide") : t("dash.seeWhy")}
                        </Button>
                      </div>

                      {showWhy && (
                        <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">{t("dash.confidence")}</p>
                            <p className="text-sm font-semibold text-foreground">
                              {priceRec?.confidence != null ? `${Math.round(priceRec.confidence * 100)}%` : "?"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">{t("dash.factors")}</p>
                            <p className="text-sm font-semibold text-foreground">
                              {priceRec?.factors?.join(", ") ?? "—"}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </section>

              {/* Buyer matching */}
              <section className="dash-section">
                <div className="dash-section-head">
                  <div>
                    <span className="eyebrow">{t("dash.buyerMatching")}</span>
                    <h2>{t("dash.bestMatches")}</h2>
                  </div>
                  <Button variant="link" size="sm" className="text-primary" onClick={() => action("Matching preferences opened.")}>
                    {t("dash.tuneMatching")} <Settings2 className="size-3.5" />
                  </Button>
                </div>
                <Card>
                  <CardContent className="divide-y p-0">
                    {matches.map((m) => (
                      <div key={m.buyer_id} className="flex items-center gap-4 p-4">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {shortBuyerId(m.buyer_id)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{shortBuyerId(m.buyer_id)}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.explanation?.distance_km ? `${m.explanation.distance_km} km` : ""}
                          </p>
                        </div>
                        <div className="hidden w-32 sm:block">
                          <Progress value={Math.round(m.score * 100)} className="h-2" />
                        </div>
                        <div className="w-14 text-right">
                          <p className="text-sm font-bold text-foreground">{Math.round(m.score * 100)}%</p>
                          <p className="text-xs text-muted-foreground">{t("dash.score")}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => action(`Match ${shortBuyerId(m.buyer_id)} opened.`)}
                          aria-label={`Open match ${shortBuyerId(m.buyer_id)}`}
                        >
                          <ArrowUpRight className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                  <div className="border-t p-4">
                    <Button variant="outline" className="w-full" onClick={() => action("Marketplace opened with matches.")}>
                      {t("dash.exploreMarketplace")} <ArrowUpRight className="size-4" />
                    </Button>
                  </div>
                </Card>
              </section>

              {/* Live operations – real shipment status */}
              <section className="dash-section">
                <div className="dash-section-head">
                  <div>
                    <span className="eyebrow">{t("dash.inMotion")}</span>
                    <h2>{t("dash.liveOps")}</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { loadData(); action("Operations refreshed."); }}
                    aria-label="Refresh operations"
                  >
                    <BarChart3 className="size-4" />
                  </Button>
                </div>
                {shipments.length > 0 ? (
                  <Card>
                    <CardContent className="space-y-4 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                            <Truck className="size-[18px]" />
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
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                          {shipments[0].status}
                        </Badge>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button variant="outline" size="sm" onClick={() => setActiveNav("routes")}>
                          <span>{t("dash.viewRoute")}</span>
                          <ArrowUpRight className="size-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground">{t("dash.noActiveShipments")}</p>
                    </CardContent>
                  </Card>
                )}
              </section>
            </>
          )}

          <footer className="footer-note">
            <span><Sprout className="size-3.5" /> {t("dash.footerBuilt")}</span>
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