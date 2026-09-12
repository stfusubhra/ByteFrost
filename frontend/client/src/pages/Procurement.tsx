import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchMe,
  fulfillOrder,
  matchSuppliers,
  SupplierMatchResponseData,
  FulfillmentPlanData,
  UserProfile,
} from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  MapPin,
  Package,
  Route as RouteIcon,
  Scale,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 0, label: "Requirement", icon: Package },
  { id: 1, label: "Match", icon: Scale },
  { id: 2, label: "Plan", icon: RouteIcon },
  { id: 3, label: "Confirm", icon: ClipboardCheck },
];

const CROPS = ["Tomato", "Onion", "Potato", "Rice", "Wheat", "Brinjal", "Cauliflower", "Cabbage", "Carrot", "Capsicum", "Garlic", "Ginger", "Mango"];

function formatINR(n: number): string {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function Procurement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // Step 0 — requirement
  const [crop, setCrop] = useState("Tomato");
  const [qty, setQty] = useState("1000");
  const [grade, setGrade] = useState("B");
  const [maxPrice, setMaxPrice] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("Pune");

  // Step 1 — match result
  const [match, setMatch] = useState<SupplierMatchResponseData | null>(null);
  // Step 2 — plan
  const [plan, setPlan] = useState<FulfillmentPlanData | null>(null);
  // Step 3 — created order id
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then((m) => {
        setMe(m);
        if (m.profile?.delivery_city) setDeliveryCity(m.profile.delivery_city);
        if (m.profile?.preferred_crops?.length) setCrop(m.profile.preferred_crops[0]);
      })
      .catch(() => {});
  }, []);

  const deliveryLat = user?.latitude ?? 18.5204;
  const deliveryLng = user?.longitude ?? 73.8567;
  const deliveryAddress = me?.address || `${deliveryCity}, Maharashtra, India`;

  const requirementValid = useMemo(
    () => crop.trim().length > 0 && Number(qty) > 0 && deliveryCity.trim().length > 0,
    [crop, qty, deliveryCity]
  );

  const handleMatch = async () => {
    setBusy(true);
    setMatch(null);
    setPlan(null);
    try {
      const result = await matchSuppliers({
        crop_name: crop.trim(),
        required_quantity_kg: Number(qty),
        min_quality_grade: grade,
        max_price_per_kg: maxPrice ? Number(maxPrice) : undefined,
        delivery_latitude: deliveryLat,
        delivery_longitude: deliveryLng,
        delivery_address: deliveryAddress,
        delivery_deadline: deadline || undefined,
      });
      setMatch(result);
      setStep(1);
      if (result.status === "FEASIBLE") {
        toast.success(`Supply matched: ${result.total_matched_kg} kg across ${result.matched_farmers.length} farmers`);
      } else if (result.status === "PARTIAL") {
        toast.warning(`${result.total_matched_kg} kg matched, ${result.shortage_kg} kg short`);
      } else {
        toast.error(result.infeasibility_reason || "No feasible supply found");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || e.message || "Matching failed");
    } finally {
      setBusy(false);
    }
  };

  const handlePlan = async () => {
    setBusy(true);
    setPlan(null);
    try {
      const result = await fulfillOrder({
        crop_name: crop.trim(),
        required_quantity_kg: Number(qty),
        min_quality_grade: grade,
        max_price_per_kg: maxPrice ? Number(maxPrice) : undefined,
        delivery_latitude: deliveryLat,
        delivery_longitude: deliveryLng,
        delivery_address: deliveryAddress,
        delivery_deadline: deadline || undefined,
      });
      setPlan(result);
      setOrderId(result.order_id || null);
      setStep(2);
      if (result.status === "FEASIBLE" || result.status === "PARTIAL") {
        toast.success("Fulfillment plan ready — route optimized");
      } else {
        toast.error(result.infeasibility_reason || "Could not build a fulfillment plan");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || e.message || "Planning failed");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (!plan || plan.shipment_ids.length === 0) return;
    setBusy(true);
    try {
      // The fulfillment service created the order (with items, allocations and
      // shipments) when the plan was built. Advance it through the lifecycle:
      // confirm -> dispatch -> ship so it shows as in transit with tracking.
      const { confirmOrder, dispatchOrder, shipOrder } = await import("@/lib/api");
      const orderIdToConfirm = plan.order_id || orderId;
      if (!orderIdToConfirm) {
        throw new Error("No order was created for this plan");
      }
      await confirmOrder(orderIdToConfirm);
      await dispatchOrder(orderIdToConfirm);
      await shipOrder(orderIdToConfirm);
      setOrderId(orderIdToConfirm);
      setStep(3);
      toast.success("Order placed — logistics dispatched");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || e.message || "Could not confirm order");
    } finally {
      setBusy(false);
    }
  };

  const totalProduceCost = useMemo(
    () =>
      match?.matched_farmers.reduce((a, f) => a + f.allocated_kg * f.price_per_kg, 0) ?? 0,
    [match]
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4 h-auto p-0 text-muted-foreground" asChild>
        <Link href="/buyer-dashboard">
          <ArrowLeft className="size-3.5" />
          Back to dashboard
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">New procurement</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define your requirement, review matched supply, and confirm an optimized fulfillment plan.
        </p>
      </div>

      {/* Stepper */}
      <ol className="mb-8 flex flex-wrap items-center gap-2">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                  active && "border-primary bg-primary/5 text-primary",
                  done && "border-emerald-300 bg-emerald-50 text-emerald-700",
                  !active && !done && "text-muted-foreground"
                )}
              >
                {done ? <CheckCircle2 className="size-3.5" /> : <Icon className="size-3.5" />}
                {s.label}
              </div>
              {s.id < STEPS.length - 1 && <div className="h-px w-5 bg-border" />}
            </li>
          );
        })}
      </ol>

      {/* STEP 0 — Requirement */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Procurement requirement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Crop</Label>
                <Select value={crop} onValueChange={setCrop}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select crop" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROPS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qty">Quantity (kg)</Label>
                <Input
                  id="qty"
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Minimum quality grade</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Grade A (Premium)</SelectItem>
                    <SelectItem value="B">Grade B (Commercial)</SelectItem>
                    <SelectItem value="C">Grade C (Standard)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maxPrice">Max budget (₹/kg, optional)</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="e.g. 35"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deadline">Delivery deadline (optional)</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">Delivery city</Label>
                <Input
                  id="city"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <Button variant="ghost" asChild>
                <Link href="/buyer-dashboard">
                  <ArrowLeft className="size-4" />
                  Cancel
                </Link>
              </Button>
              <Button onClick={handleMatch} disabled={!requirementValid || busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Scale className="size-4" />}
                {busy ? "Matching supply…" : "Match supply"}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 1 — Match */}
      {step === 1 && match && (
        <div className="space-y-5">
          <Card className={cn(
            "border",
            match.status === "FEASIBLE" && "border-emerald-300 bg-emerald-50/60",
            match.status === "PARTIAL" && "border-amber-300 bg-amber-50/60",
            match.status === "INFEASIBLE" && "border-destructive/40 bg-destructive/5"
          )}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-start gap-3">
                {match.status === "FEASIBLE" ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                ) : (
                  <Package className="mt-0.5 size-5 shrink-0 text-amber-600" />
                )}
                <div>
                  <p className="text-sm font-bold">
                    {match.status === "FEASIBLE"
                      ? `${match.required_kg} kg fully matched`
                      : match.status === "PARTIAL"
                      ? `${match.total_matched_kg} kg matched, ${match.shortage_kg} kg short`
                      : "No feasible supply"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {match.status === "FEASIBLE"
                      ? `Across ${match.matched_farmers.length} farm suppliers · ${formatINR(totalProduceCost)} produce cost`
                      : match.infeasibility_reason || "Review the allocation below."}
                  </p>
                </div>
              </div>
              {match.matched_farmers.length > 0 && (
                <Button onClick={handlePlan} disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <RouteIcon className="size-4" />}
                  {busy ? "Planning…" : "Build fulfillment plan"}
                  <ArrowRight className="size-4" />
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Required" value={`${match.required_kg} kg`} />
            <Stat label="Matched" value={`${match.total_matched_kg} kg`} tone="emerald" />
            <Stat label="Shortage" value={`${match.shortage_kg} kg`} tone={match.shortage_kg > 0 ? "amber" : undefined} />
            <Stat label="Farmers" value={String(match.matched_farmers.length)} />
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Allocated supply by farmer
            </h3>
            {match.matched_farmers.map((f, idx) => (
              <Card key={f.listing_id || idx}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{f.farmer_name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {f.distance_km.toFixed(1)} km · Grade {f.quality_grade}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <p className="font-bold text-emerald-700">{f.allocated_kg} kg</p>
                      <p className="text-[11px] text-muted-foreground">of {f.available_kg} kg available</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{f.price_per_kg}/kg</p>
                      <p className="text-[11px] text-muted-foreground">fit {Math.round(f.score * 100)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(0)}>
              <ArrowLeft className="size-4" />
              Edit requirement
            </Button>
            {match.matched_farmers.length > 0 && (
              <Button onClick={handlePlan} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <RouteIcon className="size-4" />}
                {busy ? "Planning…" : "Build fulfillment plan"}
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* STEP 2 — Plan */}
      {step === 2 && plan && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="size-5 text-primary" />
                Fulfillment plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Routing mode" value={(plan.routing_mode || "direct").replace("_", " ")} />
                <Stat label="Shipments" value={String(plan.shipment_ids.length)} />
                <Stat
                  label="Est. delivery"
                  value={plan.estimated_delivery ? new Date(plan.estimated_delivery).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                />
                <Stat
                  label="Consolidation saving"
                  value={plan.consolidation_savings_km ? `${plan.consolidation_savings_km.toFixed(0)} km` : "—"}
                  tone="emerald"
                />
              </div>

              {plan.landed_cost && (
                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Landed cost breakdown
                  </p>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
                    <CostRow label="Produce" value={plan.landed_cost.produce_cost} />
                    <CostRow label="Transport" value={plan.landed_cost.transport_cost} />
                    <CostRow label="Handling" value={plan.landed_cost.handling_cost} />
                    <CostRow label="Expected loss" value={plan.landed_cost.expected_loss} />
                    <CostRow label="Total" value={plan.landed_cost.total} strong />
                    <CostRow label="Per delivered kg" value={plan.landed_cost.cost_per_delivered_kg} strong />
                  </dl>
                </div>
              )}

              {plan.explanation && (
                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Why this plan
                  </p>
                  <p className="text-sm text-muted-foreground">{plan.explanation.why_selected}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <Stat label="Total distance" value={`${plan.explanation.total_distance_km.toFixed(0)} km`} />
                    <Stat label="Duration" value={`${plan.explanation.total_duration_hours.toFixed(1)} h`} />
                    <Stat label="Total cost" value={formatINR(plan.explanation.total_cost)} />
                    <Stat label="Savings" value={formatINR(plan.explanation.estimated_savings_inr)} tone="emerald" />
                  </div>
                </div>
              )}

              {plan.vehicle_routes && plan.vehicle_routes.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Vehicle routes
                  </p>
                  {plan.vehicle_routes.map((r, idx) => (
                    <div key={r.vehicle_id} className="rounded-lg border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">
                          Vehicle {idx + 1}
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            {r.load_kg} kg · {r.distance_km.toFixed(0)} km · {Math.round(r.duration_min)} min
                          </span>
                        </p>
                        <Badge variant="secondary">{formatINR(r.operating_cost)}</Badge>
                      </div>
                      <ol className="mt-3 space-y-1.5">
                        {r.stops.map((s, si) => (
                          <li key={si} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                              {s.sequence}
                            </span>
                            <span className="capitalize">{s.stop_type.toLowerCase()}</span>
                            <span className="ml-auto">
                              {s.quantity_kg > 0 ? `${s.quantity_kg} kg` : "—"}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(1)} disabled={busy}>
              <ArrowLeft className="size-4" />
              Back to match
            </Button>
            <Button onClick={handleConfirm} disabled={busy || plan.shipment_ids.length === 0}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}
              {busy ? "Placing order…" : "Confirm & place order"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 — Confirmed */}
      {step === 3 && orderId && (
        <Card className="border-emerald-300 bg-emerald-50/60">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="size-7" />
            </span>
            <div>
              <h2 className="text-xl font-bold">Order placed</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {crop} · {Number(qty)} kg · {formatINR(totalProduceCost)} produce cost. Logistics dispatched with live tracking.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href={`/buyer/orders/${orderId}`}>
                  View order & tracking
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/buyer-dashboard">Back to dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, tone, strong }: { label: string; value: string; tone?: "emerald" | "amber"; strong?: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <span className="block text-[11px] text-muted-foreground">{label}</span>
      <strong
        className={cn(
          "mt-0.5 block text-sm",
          strong && "text-base",
          tone === "emerald" && "text-emerald-700",
          tone === "amber" && "text-amber-700"
        )}
      >
        {value}
      </strong>
    </div>
  );
}

function CostRow({ label, value, strong }: { label: string; value?: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className={cn("text-muted-foreground", strong && "font-semibold text-foreground")}>{label}</dt>
      <dd className={cn("font-semibold", strong && "text-primary")}>
        {value != null ? formatINR(value) : "—"}
      </dd>
    </div>
  );
}