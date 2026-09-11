import React, { useEffect, useState } from "react";
import { Link } from "wouter";
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
  ArrowLeft,
  Loader2,
  Truck,
  Package,
  ShoppingBag,
  ArrowRight,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Scale,
} from "lucide-react";
import RouteMap from "@/components/RouteMap";
import TrackingTimeline from "@/components/TrackingTimeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

      if (plan.status === "FEASIBLE" || plan.status === "PARTIAL") {
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
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 h-auto p-0 text-muted-foreground" asChild>
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs">
              <ArrowLeft className="size-3.5" />
              {tr("dash.backToSite", "Back to site")}
            </Link>
          </Button>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Procurement Portal
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            {tr("buyer.dashboard.title", "Buyer Procurement & Fulfillment Dashboard")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Multi-farmer supplier matching, transparent quantity allocation, and automated logistics.
          </p>
        </div>
      </div>

      {/* SECTION 1: SMART SUPPLIER MATCHING & QUANTITY ALLOCATION CALCULATOR */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 border-b">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5 text-primary" />
              Intelligent Multi-Farmer Matching & Quantity Allocation
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Evaluates quantity, distance, quality, freshness, reliability, and transport economics across multiple farmers.
            </p>
          </div>
          <Badge variant="secondary">Automated Aggregation</Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Inputs row */}
          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Crop Name</Label>
              <Input
                type="text"
                value={sourcingCrop}
                onChange={(e) => setSourcingCrop(e.target.value)}
                placeholder="e.g. Tomato, Onion"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Required Volume (kg)</Label>
              <Input
                type="number"
                value={sourcingQty}
                onChange={(e) => setSourcingQty(Number(e.target.value))}
                placeholder="e.g. 1000"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Min Quality Grade</Label>
              <Select value={sourcingGrade} onValueChange={setSourcingGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Grade A (Premium)</SelectItem>
                  <SelectItem value="B">Grade B (Commercial)</SelectItem>
                  <SelectItem value="C">Grade C (Standard)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Max Budget (₹/kg)</Label>
              <Input
                type="number"
                value={sourcingMaxPrice}
                onChange={(e) => setSourcingMaxPrice(e.target.value)}
                placeholder="Optional limit"
              />
            </div>
            <Button onClick={handleMatchSuppliers} disabled={isMatching} className="w-full">
              {isMatching ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <Scale className="size-4" />
                  <span>Allocate Supply</span>
                </>
              )}
            </Button>
          </div>

          {/* Matching Result Breakdown */}
          {matchPlan && (
            <div className="space-y-4 border-t pt-4">
              {/* Status Summary Banner */}
              <Alert
                variant={
                  matchPlan.status === "FEASIBLE"
                    ? "default"
                    : matchPlan.status === "PARTIAL"
                    ? "default"
                    : "destructive"
                }
                className={
                  matchPlan.status === "FEASIBLE"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                    : matchPlan.status === "PARTIAL"
                    ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                    : ""
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {matchPlan.status === "FEASIBLE" ? (
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
                    )}
                    <div>
                      <AlertTitle className="text-sm font-bold">
                        Status: {matchPlan.status} FULFILLMENT
                      </AlertTitle>
                      <AlertDescription className="text-xs opacity-90">
                        {matchPlan.status === "FEASIBLE"
                          ? `Requirement of ${matchPlan.required_kg} kg completely matched across ${matchPlan.matched_farmers.length} farm supplier(s).`
                          : matchPlan.status === "PARTIAL"
                          ? `Partial volume: ${matchPlan.total_matched_kg} kg matched. Shortage: ${matchPlan.shortage_kg} kg cannot be economically fulfilled.`
                          : matchPlan.infeasibility_reason || "No feasible farmers match criteria."}
                      </AlertDescription>
                    </div>
                  </div>

                  {matchPlan.matched_farmers.length > 0 && (
                    <Button size="sm" onClick={handleFulfillPlan} disabled={isFulfilling}>
                      <span>{isFulfilling ? "Booking..." : "Dispatch Consolidated Route"}</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  )}
                </div>
              </Alert>

              {/* Quantity Allocation Summary Chips */}
              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div className="rounded-lg border bg-muted/40 p-3">
                  <span className="block text-muted-foreground">Required</span>
                  <strong className="text-sm text-foreground">{matchPlan.required_kg} kg</strong>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <span className="block text-muted-foreground">Total Allocated</span>
                  <strong className="text-sm text-emerald-600">{matchPlan.total_matched_kg} kg</strong>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <span className="block text-muted-foreground">Shortage</span>
                  <strong className={`text-sm ${matchPlan.shortage_kg > 0 ? "text-amber-600" : "text-foreground"}`}>
                    {matchPlan.shortage_kg} kg
                  </strong>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <span className="block text-muted-foreground">Contributing Farmers</span>
                  <strong className="text-sm text-foreground">{matchPlan.matched_farmers.length}</strong>
                </div>
              </div>

              {/* Farmer Allocation Breakdown Cards */}
              {matchPlan.matched_farmers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Optimal Farmer Contribution Breakdown
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {matchPlan.matched_farmers.map((farmer, idx) => (
                      <Card key={farmer.listing_id || idx} className="transition-colors hover:border-primary/50">
                        <CardContent className="space-y-3 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                                  {idx + 1}
                                </span>
                                <h4 className="text-sm font-bold text-foreground">
                                  {farmer.farmer_name}
                                </h4>
                              </div>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {farmer.distance_km} km away · Grade {farmer.quality_grade}
                              </span>
                            </div>
                            <Badge variant="secondary">₹{farmer.price_per_kg}/kg</Badge>
                          </div>

                          {/* Quantity Contribution Highlight */}
                          <div className="flex items-center justify-between rounded-lg border border-emerald-200/50 bg-emerald-50/50 p-2.5 text-xs dark:bg-emerald-950/20">
                            <div>
                              <span className="block text-[11px] text-muted-foreground">Allocated Contribution</span>
                              <strong className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                {farmer.allocated_kg} kg
                              </strong>
                            </div>
                            <div className="text-right">
                              <span className="block text-[11px] text-muted-foreground">Available Total</span>
                              <span className="font-semibold text-foreground">{farmer.available_kg} kg</span>
                            </div>
                          </div>

                          {/* Transparent factors */}
                          <div className="grid grid-cols-2 gap-2 border-t pt-1 text-[11px] text-muted-foreground">
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: MARKETPLACE BROWSE & CART */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Marketplace listings */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Package className="size-5 text-primary" />
              <span>Available Farm Produce Listings</span>
            </h2>
            <span className="text-xs text-muted-foreground">
              {listings.length} crops ready for harvest/pickup
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="space-y-3 p-4">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {listings.map((l) => (
                <Card key={l.id} className="flex flex-col justify-between space-y-3 transition-shadow hover:shadow-md">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-base font-bold text-foreground">{l.crop_name}</h3>
                      {l.quality_grade && (
                        <Badge variant="secondary">Grade {l.quality_grade}</Badge>
                      )}
                    </div>
                    <p className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {l.pickup_location || "Verified Farmer Location"}
                    </p>

                    <div className="flex items-baseline justify-between border-t pt-2 text-sm">
                      <div>
                        <span className="text-lg font-bold text-foreground">₹{l.price_per_kg}</span>
                        <span className="text-xs text-muted-foreground"> / kg</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {l.quantity_kg} kg available
                      </span>
                    </div>

                    <Button className="w-full" onClick={() => addToCart(l)}>
                      {tr("buyer.addToCart", "Add to Order")} (+50 kg)
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Order Cart Drawer */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="size-5 text-primary" />
                <span>{tr("buyer.cart.title", "Procurement Cart")} ({cart.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {cart.length === 0 ? (
                <p className="py-6 text-center text-xs italic text-muted-foreground">
                  Your cart is currently empty. Add produce items or use the Multi-Farmer Calculator above.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                    {cart.map((c, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-muted/40 p-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-foreground">{c.crop_name}</span>
                          <span className="block text-muted-foreground">{c.quantity} kg</span>
                        </div>
                        <span className="font-bold text-foreground">
                          ₹{(c.quantity * (c.price_per_kg || 0)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 border-t pt-3">
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

                  <Button className="w-full" onClick={checkout}>
                    <span>{tr("buyer.checkout", "Confirm & Place Order")}</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 3: LIVE DELIVERIES & GPS LOGISTICS */}
      <div className="space-y-6 border-t pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Truck className="size-6 text-primary" />
              <span>Live Order Shipments & Deliveries</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Monitor multi-farmer collection routes, delivery ETAs, and checkpoint milestones.
            </p>
          </div>
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
                    <span>Shipment #{idx + 1} ({s.status})</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={selectedShipment?.id ?? ""} className="mt-6">
                {trackingLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Loading tracking data...</div>
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
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="space-y-2">
              <Truck className="mx-auto size-8 text-muted-foreground opacity-50" />
              <p className="text-sm font-semibold text-foreground">No active shipments in transit</p>
              <p className="text-xs text-muted-foreground">
                Allocate supply and dispatch an order above to generate an optimized delivery route.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}