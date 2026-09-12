import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import {
  fetchOrderDetail,
  fetchShipment,
  fetchTracking,
  OrderDetail,
  ShipmentDetailItem,
  TrackingStatusData,
} from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Loader2,
  MapPin,
  Package,
  Truck,
} from "lucide-react";
import RouteMap from "@/components/RouteMap";
import TrackingTimeline from "@/components/TrackingTimeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  in_transit: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-muted text-muted-foreground",
};

function formatINR(n: number): string {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function BuyerOrderDetail() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState<ShipmentDetailItem | null>(null);
  const [tracking, setTracking] = useState<TrackingStatusData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const loadShipment = useCallback(
    async (shipmentId: string) => {
      setTrackingLoading(true);
      try {
        const [s, t] = await Promise.all([
          fetchShipment(shipmentId),
          fetchTracking(shipmentId).catch(() => null),
        ]);
        setShipment(s);
        setTracking(t);
      } catch (e) {
        console.error("Failed to load shipment tracking", e);
      } finally {
        setTrackingLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    fetchOrderDetail(orderId)
      .then((data) => {
        setOrder(data);
        if (data.shipments?.length > 0) {
          loadShipment(data.shipments[0].id);
        }
      })
      .catch((e) => {
        toast.error(e.response?.data?.detail || "Could not load order");
      })
      .finally(() => setLoading(false));
  }, [orderId, loadShipment]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Order not found.</p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/buyer/orders">Back to orders</Link>
        </Button>
      </div>
    );
  }

  const totalKg = order.items.reduce((a, i) => a + i.quantity_kg, 0);
  const activeShipmentId = shipment?.id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4 h-auto p-0 text-muted-foreground" asChild>
        <Link href="/buyer/orders">
          <ArrowLeft className="size-3.5" />
          Back to orders
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
            <Badge className={STATUS_TONE[order.status] || "bg-muted text-muted-foreground"}>
              {STATUS_LABEL[order.status] || order.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {new Date(order.created_at).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" · "}
            {totalKg} kg
            {order.total_amount ? ` · ${formatINR(order.total_amount)}` : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/buyer/procurement">
            <Package className="size-4" />
            New procurement
          </Link>
        </Button>
      </div>

      {/* Delivery info */}
      {(order.delivery_address || order.delivery_deadline) && (
        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-2 p-4 text-sm">
            {order.delivery_address && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4 text-primary" />
                {order.delivery_address}
              </p>
            )}
            {order.delivery_deadline && (
              <p className="text-muted-foreground">
                Deadline:{" "}
                <strong className="text-foreground">
                  {new Date(order.delivery_deadline).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-5 text-primary" />
            Order items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
            >
              <div>
                <p className="text-sm font-semibold">{item.crop_name || "Produce"}</p>
                <p className="text-xs text-muted-foreground">
                  {item.seller_name || "Farm supplier"}
                  {item.pickup_location ? ` · ${item.pickup_location}` : ""}
                  {item.quality_grade ? ` · Grade ${item.quality_grade}` : ""}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold">{item.quantity_kg} kg</p>
                <p className="text-xs text-muted-foreground">₹{item.price_per_kg}/kg</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Allocations */}
      {order.allocations.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Supply allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.allocations.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-semibold">{a.seller_name || "Supplier"}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.crop_name || "Produce"}
                    {a.score != null ? ` · match fit ${Math.round(a.score * 100)}%` : ""}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">{a.quantity_kg} kg</p>
                  {a.price_per_kg != null && (
                    <p className="text-xs text-muted-foreground">₹{a.price_per_kg}/kg</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Shipments + tracking */}
      {order.shipments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="size-5 text-primary" />
              Shipments & tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeShipmentId ?? order.shipments[0].id}
              onValueChange={(v) => loadShipment(v)}
            >
              <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                {order.shipments.map((s, idx) => (
                  <TabsTrigger
                    key={s.id}
                    value={s.id}
                    className="gap-1.5 border data-[state=active]:border-primary"
                  >
                    <Truck className="size-3.5" />
                    Shipment #{idx + 1} ({s.status})
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeShipmentId ?? ""} className="mt-6">
                {trackingLoading ? (
                  <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading tracking…
                  </div>
                ) : shipment ? (
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="space-y-4 xl:col-span-2">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <MiniStat
                          label="Vehicle"
                          value={shipment.vehicle?.vehicle_type || "—"}
                        />
                        <MiniStat
                          label="Capacity"
                          value={shipment.vehicle ? `${shipment.vehicle.capacity_kg} kg` : "—"}
                        />
                        <MiniStat
                          label="Distance"
                          value={shipment.estimated_distance_km != null ? `${shipment.estimated_distance_km.toFixed(0)} km` : "—"}
                        />
                        <MiniStat
                          label="Landed cost"
                          value={shipment.landed_cost != null ? formatINR(shipment.landed_cost) : "—"}
                        />
                      </div>
                      <RouteMap
                        stops={shipment.stops || []}
                        vehicle={shipment.vehicle}
                        distanceKm={shipment.estimated_distance_km}
                        durationMin={shipment.estimated_duration_min}
                        routeMode={shipment.route_mode || "direct"}
                        mapsUrl={shipment.maps_url}
                      />
                    </div>
                    <div>
                      <TrackingTimeline
                        shipmentId={shipment.id}
                        currentStatus={shipment.status}
                        events={tracking?.events || []}
                        estimatedArrival={tracking?.estimated_arrival || shipment.delivery_time}
                        currentLat={tracking?.current_latitude}
                        currentLng={tracking?.current_longitude}
                        onRefresh={() => loadShipment(shipment.id)}
                      />
                    </div>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex justify-end">
        <Button variant="outline" asChild>
          <Link href="/buyer/orders">
            Back to orders
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <span className="block text-[11px] text-muted-foreground">{label}</span>
      <strong className={cn("mt-0.5 block text-sm")}>{value}</strong>
    </div>
  );
}