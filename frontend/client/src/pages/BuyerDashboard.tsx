import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchListings,
  createOrder,
  fetchShipments,
  fetchShipment,
  fetchTracking,
  matchSuppliers,
  fulfillOrder,
  ShipmentItem,
  ShipmentDetailItem,
  TrackingStatusData,
  SupplierMatchResponseData,
} from "@/lib/api";
import { toast } from "sonner";
import {
  Truck,
  Package,
  ShoppingBag,
  ArrowRight,
  MapPin,
  Clock,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Users,
  Scale,
  ShieldCheck,
  ChevronRight,
  TrendingDown,
} from "lucide-react";
import RouteMap from "@/components/RouteMap";
import TrackingTimeline from "@/components/TrackingTimeline";

export default function BuyerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const tr = (key: string, fallback: string) => (t as any)(key) || fallback;
  const [listings, setListings] = useState([] as any[]);
  const [cart, setCart] = useState([] as any[]);
  const [loading, setLoading] = useState(true);

  // Logistics & Tracking state
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentDetailItem | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingStatusData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Multi-Farmer Matching & Quantity Allocation state
  const [sourcingCrop, setSourcingCrop] = useState("Tomato");
  const [sourcingQty, setSourcingQty] = useState<number>(1000);
  const [sourcingGrade, setSourcingGrade] = useState("B");
  const [sourcingMaxPrice, setSourcingMaxPrice] = useState<string>("");
  const [matchPlan, setMatchPlan] = useState<SupplierMatchResponseData | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [isFulfilling, setIsFulfilling] = useState(false);

  const loadShipmentDetail = async (id: string) => {
    setTrackingLoading(true);
    try {
      const detail = await fetchShipment(id);
      setSelectedShipment(detail);
      const tracking = await fetchTracking(id);
      setTrackingData(tracking);
    } catch (e) {
      console.error("Failed to load tracking data", e);
    } finally {
      setTrackingLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [data, shipList] = await Promise.all([
        fetchListings(),
        fetchShipments().catch(() => []),
      ]);
      setListings(data);
      setShipments(shipList);
      if (shipList.length > 0) {
        await loadShipmentDetail(shipList[0].id);
      }
    } catch (e) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated]);

  const addToCart = (listing: any) => {
    setCart((c) => {
      const existing = c.find((i) => i.id === listing.id);
      if (existing) {
        return c.map((i) =>
          i.id === listing.id ? { ...i, quantity: i.quantity + 10 } : i
        );
      }
      return [...c, { ...listing, quantity: 50 }];
    });
    toast.success(`Added ${listing.crop_name} to cart`);
  };

  const checkout = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    try {
      const order = await createOrder({
        items: cart.map((i) => ({ listing_id: i.id, quantity_kg: i.quantity })),
        delivery_address: (user as any)?.address || "Buyer Default Delivery Hub, India",
        delivery_latitude: user?.latitude || 19.033,
        delivery_longitude: user?.longitude || 73.0297,
      });
      toast.success(`Order placed successfully! ID: ${order.id}`);
      setCart([]);
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Order checkout failed");
    }
  };

  const handleMatchSuppliers = async () => {
    if (!sourcingCrop.trim()) {
      return toast.error("Please enter a produce crop name");
    }
    if (!sourcingQty || sourcingQty <= 0) {
      return toast.error("Please specify a valid requirement quantity (kg)");
    }

    setIsMatching(true);
    setMatchPlan(null);
    try {
      const result = await matchSuppliers({
        crop_name: sourcingCrop.trim(),
        required_quantity_kg: Number(sourcingQty),
        min_quality_grade: sourcingGrade,
        max_price_per_kg: sourcingMaxPrice ? Number(sourcingMaxPrice) : undefined,
        delivery_latitude: user?.latitude || 19.033,
        delivery_longitude: user?.longitude || 73.0297,
        delivery_address: (user as any)?.address || "Buyer Distribution Hub",
      });

      setMatchPlan(result);
      if (result.status === "FEASIBLE") {
        toast.success(`100% supply matched across ${result.matched_farmers.length} farmer(s)!`);
      } else if (result.status === "PARTIAL") {
        toast.warning(
          `Partial fulfillment: ${result.total_matched_kg} kg matched, ${result.shortage_kg} kg shortage.`
        );
      } else {
        toast.error(result.infeasibility_reason || "No matching farmers found");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Supplier matching calculation failed");
    } finally {
      setIsMatching(false);
    }
  };

  const handleFulfillPlan = async () => {
    if (!matchPlan || matchPlan.matched_farmers.length === 0) return;
    setIsFulfilling(true);
    try {
      const plan = await fulfillOrder({
        crop_name: sourcingCrop.trim(),
        required_quantity_kg: Number(sourcingQty),
        min_quality_grade: sourcingGrade,
        delivery_latitude: user?.latitude || 19.033,
        delivery_longitude: user?.longitude || 73.0297,
        delivery_address: (user as any)?.address || "Buyer Distribution Hub",
        max_price_per_kg: sourcingMaxPrice ? Number(sourcingMaxPrice) : undefined,
      });

      if (plan.status === "CONFIRMED" || plan.status === "PLANNED") {
        toast.success(`Order fulfilled! Shipment created: ${plan.shipment_ids?.[0] || "Active"}`);
        setMatchPlan(null);
        await loadData();
      } else {
        toast.error(plan.infeasibility_reason || "Could not book consolidation route");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Fulfillment booking failed");
    } finally {
      setIsFulfilling(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {tr("common.loginRequired", "Please log in to access the buyer portal.")}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b">
        <div>
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Procurement Portal
          </span>
          <h1 className="text-2xl font-bold text-foreground">
            {tr("buyer.dashboard.title", "Buyer Procurement & Fulfillment Dashboard")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Multi-farmer supplier matching, transparent quantity allocation, and automated logistics.
          </p>
        </div>
      </div>

      {/* SECTION 1: SMART SUPPLIER MATCHING & QUANTITY ALLOCATION CALCULATOR */}
      <section className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-foreground">
                Intelligent Multi-Farmer Matching & Quantity Allocation
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Evaluates quantity, distance, quality, freshness, reliability, and transport economics across multiple farmers.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium border border-emerald-200/50">
            Automated Aggregation
          </span>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Crop Name
            </label>
            <input
              type="text"
              value={sourcingCrop}
              onChange={(e) => setSourcingCrop(e.target.value)}
              placeholder="e.g. Tomato, Onion"
              className="w-full px-3 py-2 text-xs rounded-lg border bg-background text-foreground focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Required Volume (kg)
            </label>
            <input
              type="number"
              value={sourcingQty}
              onChange={(e) => setSourcingQty(Number(e.target.value))}
              placeholder="e.g. 1000"
              className="w-full px-3 py-2 text-xs rounded-lg border bg-background text-foreground focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Min Quality Grade
            </label>
            <select
              value={sourcingGrade}
              onChange={(e) => setSourcingGrade(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border bg-background text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="A">Grade A (Premium)</option>
              <option value="B">Grade B (Commercial)</option>
              <option value="C">Grade C (Standard)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Max Budget (₹/kg)
            </label>
            <input
              type="number"
              value={sourcingMaxPrice}
              onChange={(e) => setSourcingMaxPrice(e.target.value)}
              placeholder="Optional limit"
              className="w-full px-3 py-2 text-xs rounded-lg border bg-background text-foreground focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <button
              onClick={handleMatchSuppliers}
              disabled={isMatching}
              className="btn btn-primary w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              {isMatching ? (
                <span>Calculating...</span>
              ) : (
                <>
                  <Scale className="w-4 h-4" />
                  <span>Allocate Supply</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Matching Result Breakdown */}
        {matchPlan && (
          <div className="space-y-4 pt-4 border-t">
            {/* Status Summary Banner */}
            <div
              className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
                matchPlan.status === "FEASIBLE"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-200"
                  : matchPlan.status === "PARTIAL"
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-900 dark:text-amber-200"
                  : "bg-red-50 dark:bg-red-950/40 border-red-200 text-red-900 dark:text-red-200"
              }`}
            >
              <div className="flex items-center gap-3">
                {matchPlan.status === "FEASIBLE" ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : matchPlan.status === "PARTIAL" ? (
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    Status: {matchPlan.status} FULFILLMENT
                  </h4>
                  <p className="text-xs opacity-90">
                    {matchPlan.status === "FEASIBLE"
                      ? `Requirement of ${matchPlan.required_kg} kg completely matched across ${matchPlan.matched_farmers.length} farm supplier(s).`
                      : matchPlan.status === "PARTIAL"
                      ? `Partial volume: ${matchPlan.total_matched_kg} kg matched. Shortage: ${matchPlan.shortage_kg} kg cannot be economically fulfilled.`
                      : matchPlan.infeasibility_reason || "No feasible farmers match criteria."}
                  </p>
                </div>
              </div>

              {/* Action button if farmers matched */}
              {matchPlan.matched_farmers.length > 0 && (
                <button
                  onClick={handleFulfillPlan}
                  disabled={isFulfilling}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
                >
                  <span>{isFulfilling ? "Booking..." : "Dispatch Consolidated Route"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quantity Allocation Summary Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-muted/40 border rounded-lg">
                <span className="text-muted-foreground block">Required</span>
                <strong className="text-sm text-foreground">{matchPlan.required_kg} kg</strong>
              </div>
              <div className="p-3 bg-muted/40 border rounded-lg">
                <span className="text-muted-foreground block">Total Allocated</span>
                <strong className="text-sm text-emerald-600">{matchPlan.total_matched_kg} kg</strong>
              </div>
              <div className="p-3 bg-muted/40 border rounded-lg">
                <span className="text-muted-foreground block">Shortage</span>
                <strong className={`text-sm ${matchPlan.shortage_kg > 0 ? "text-amber-600" : "text-foreground"}`}>
                  {matchPlan.shortage_kg} kg
                </strong>
              </div>
              <div className="p-3 bg-muted/40 border rounded-lg">
                <span className="text-muted-foreground block">Contributing Farmers</span>
                <strong className="text-sm text-foreground">{matchPlan.matched_farmers.length}</strong>
              </div>
            </div>

            {/* Farmer Allocation Breakdown Cards */}
            {matchPlan.matched_farmers.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Optimal Farmer Contribution Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {matchPlan.matched_farmers.map((farmer, idx) => (
                    <div
                      key={farmer.listing_id || idx}
                      className="border rounded-xl p-4 bg-background space-y-3 shadow-sm hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <h4 className="font-bold text-sm text-foreground">
                              {farmer.farmer_name}
                            </h4>
                          </div>
                          <span className="text-xs text-muted-foreground block mt-0.5">
                            {farmer.distance_km} km away · Grade {farmer.quality_grade}
                          </span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                          ₹{farmer.price_per_kg}/kg
                        </span>
                      </div>

                      {/* Quantity Contribution Highlight */}
                      <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Allocated Contribution</span>
                          <strong className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            {farmer.allocated_kg} kg
                          </strong>
                        </div>
                        <div className="text-right">
                          <span className="text-muted-foreground block text-[11px]">Available Total</span>
                          <span className="font-semibold text-foreground">{farmer.available_kg} kg</span>
                        </div>
                      </div>

                      {/* Transparent factors */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t text-muted-foreground">
                        <div>
                          <span>Est. Transport:</span>{" "}
                          <strong className="text-foreground">₹{farmer.estimated_transport_cost}</strong>
                        </div>
                        <div>
                          <span>Reliability:</span>{" "}
                          <strong className="text-foreground">{Math.round(farmer.reliability_score * 100)}%</strong>
                        </div>
                        <div>
                          <span>Overall Fit:</span>{" "}
                          <strong className="text-foreground">{Math.round(farmer.score * 100)}%</strong>
                        </div>
                        <div>
                          <span>Quality Grade:</span>{" "}
                          <strong className="text-foreground">{farmer.quality_grade}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 2: MARKETPLACE BROWSE & CART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Marketplace listings */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <span>Available Farm Produce Listings</span>
            </h2>
            <span className="text-xs text-muted-foreground">
              {listings.length} crops ready for harvest/pickup
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">{tr("common.loading", "Loading farm listings...")}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((l) => (
                <div
                  key={l.id}
                  className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-base text-foreground">{l.crop_name}</h3>
                      {l.quality_grade && (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                          Grade {l.quality_grade}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {l.pickup_location || "Verified Farmer Location"}
                    </p>
                  </div>

                  <div className="flex items-baseline justify-between border-t pt-2 text-sm">
                    <div>
                      <span className="text-lg font-bold text-foreground">₹{l.price_per_kg}</span>
                      <span className="text-xs text-muted-foreground"> / kg</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {l.quantity_kg} kg available
                    </span>
                  </div>

                  <button
                    className="btn btn-primary w-full py-1.5 text-xs font-semibold"
                    onClick={() => addToCart(l)}
                  >
                    {tr("buyer.addToCart", "Add to Order")} (+50 kg)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Cart Drawer */}
        <div className="space-y-4">
          <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2 border-b pb-3">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <span>{tr("buyer.cart.title", "Procurement Cart")} ({cart.length})</span>
            </h3>

            {cart.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center italic">
                Your cart is currently empty. Add produce items or use the Multi-Farmer Calculator above.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {cart.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40"
                    >
                      <div>
                        <span className="font-semibold text-foreground">{c.crop_name}</span>
                        <span className="text-muted-foreground block">{c.quantity} kg</span>
                      </div>
                      <span className="font-bold text-foreground">
                        ₹{(c.quantity * (c.price_per_kg || 0)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total Weight:</span>
                    <span className="font-semibold text-foreground">
                      {cart.reduce((acc, i) => acc + i.quantity, 0)} kg
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-foreground">
                    <span>Est. Produce Total:</span>
                    <span>
                      ₹
                      {cart
                        .reduce((acc, i) => acc + i.quantity * (i.price_per_kg || 0), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  className="btn btn-primary w-full py-2 text-sm font-semibold flex items-center justify-center gap-2"
                  onClick={checkout}
                >
                  <span>{tr("buyer.checkout", "Confirm & Place Order")}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: LIVE DELIVERIES & GPS LOGISTICS */}
      <div className="space-y-6 pt-6 border-t">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Truck className="w-6 h-6 text-emerald-600" />
              <span>Live Order Shipments & Deliveries</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Monitor multi-farmer collection routes, delivery ETAs, and checkpoint milestones.
            </p>
          </div>
        </div>

        {shipments.length > 0 ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 pb-2">
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
                  <span>Shipment #{idx + 1} ({s.status})</span>
                </button>
              ))}
            </div>

            {trackingLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading tracking data...</div>
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
                <div>
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
            ) : null}
          </div>
        ) : (
          <div className="bg-card border rounded-2xl p-8 text-center space-y-2">
            <Truck className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm font-semibold text-foreground">No active shipments in transit</p>
            <p className="text-xs text-muted-foreground">
              Allocate supply and dispatch an order above to generate an optimized delivery route.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
