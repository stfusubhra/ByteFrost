import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  fetchListings,
  createOrder,
  fetchShipments,
  fetchShipment,
  fetchTracking,
  ShipmentItem,
  ShipmentDetailItem,
  TrackingStatusData,
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
            Direct farmer-to-business sourcing with automated multi-stop logistics & live tracking.
          </p>
        </div>
      </div>

      {/* Main Grid: Marketplace & Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Marketplace listings */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <span>Available Farm Listings</span>
            </h2>
            <span className="text-xs text-muted-foreground">
              {listings.length} crops ready for pickup
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
                Your cart is currently empty. Add produce items from the left.
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

      {/* Live Shipments & Logistics Tracking Section */}
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
            {/* Shipment select tabs */}
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
              Place an order from the farm marketplace above to generate an optimized delivery route.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
