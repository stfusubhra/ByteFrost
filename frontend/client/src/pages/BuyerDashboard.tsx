import React, { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchListings,
  fetchOrders,
  fetchMe,
  Listing,
  OrderResponse,
  UserProfile,
} from "@/lib/api";
import { IMG, CATEGORY_MAP } from "@/lib/marketplace-data";
import { toast } from "sonner";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  MapPin,
  Package,
  Plus,
  ShoppingCart,
  Truck,
  UserRound,
} from "lucide-react";
import NotificationsBell from "@/components/NotificationsBell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

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

function cropImage(crop: string): string {
  const key = crop.toLowerCase();
  const map: Record<string, string> = {
    tomato: IMG.tomato,
    onion: IMG.onion,
    potato: IMG.potato,
    rice: IMG.rice,
    wheat: IMG.wheat,
    brinjal: IMG.brinjal,
    cauliflower: IMG.cauliflower,
    mango: IMG.mango,
    cabbage: IMG.cabbage,
    carrot: IMG.carrot,
    capsicum: IMG.capsicum,
    garlic: IMG.garlic,
    ginger: IMG.ginger,
  };
  return map[key] || IMG.tomato;
}

function formatINR(n: number): string {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function BuyerDashboard() {
  const { user, logout } = useAuth();
  const [me, setMe] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [profile, listingData, orderData] = await Promise.all([
        fetchMe().catch(() => null),
        fetchListings({ limit: 6 }),
        fetchOrders({ limit: 6 }),
      ]);
      setMe(profile);
      setListings(listingData);
      setOrders(orderData);
    } catch (e) {
      toast.error("Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const needsOnboarding = me && !me.profile?.onboarding_completed;
  const activeOrders = orders.filter((o) => ["pending", "confirmed", "in_transit"].includes(o.status));
  const recentOrders = orders.slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Buyer procurement portal
          </p>
          <h1 className="mt-0.5 text-2xl font-bold">
            {me?.profile?.business_name || user?.full_name || "Buyer"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {me?.profile?.delivery_city
              ? `Delivering to ${me.profile.delivery_city}`
              : "Source verified farm supply with optimized logistics"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsBell />
          <Button variant="outline" size="sm" onClick={() => logout()}>
            <UserRound className="size-4" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Onboarding banner */}
      {needsOnboarding && (
        <Card className="mb-8 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <UserRound className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Complete your buyer profile</p>
                <p className="text-xs text-muted-foreground">
                  Tell us your business, delivery city and preferred crops so matching is tuned to you.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/buyer/onboarding">
                Set up profile
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Button asChild variant="default" className="h-auto justify-start gap-3 p-4">
          <Link href="/buyer/procurement">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white/15">
              <ShoppingCart className="size-5" />
            </span>
            <span className="text-left">
              <span className="block text-sm font-semibold">New procurement</span>
              <span className="block text-xs opacity-80">Match supply, plan route, place order</span>
            </span>
            <ArrowRight className="ml-auto size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
          <Link href="/buyer/orders">
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <ClipboardList className="size-5" />
            </span>
            <span className="text-left">
              <span className="block text-sm font-semibold">Order history</span>
              <span className="block text-xs text-muted-foreground">Track and review orders</span>
            </span>
            <ArrowRight className="ml-auto size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
          <Link href="/buyer/insights">
            <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <BarChart3 className="size-5" />
            </span>
            <span className="text-left">
              <span className="block text-sm font-semibold">Insights</span>
              <span className="block text-xs text-muted-foreground">Spend, suppliers, delivery performance</span>
            </span>
            <ArrowRight className="ml-auto size-4" />
          </Link>
        </Button>
      </div>

      {/* Recommended supply */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Package className="size-5 text-primary" />
            Recommended supply
          </h2>
          <span className="text-xs text-muted-foreground">
            {listings.length} verified listings available now
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="space-y-3 p-4">
                  <Skeleton className="h-28 w-full rounded-md" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Package />
              </EmptyMedia>
              <EmptyTitle>No supply listed right now</EmptyTitle>
              <EmptyDescription>
                Farmers haven't posted availability yet. Check back soon or start a procurement to see what can be matched.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <Card key={l.id} className="overflow-hidden">
                <div className="relative h-28">
                  <img
                    src={cropImage(l.crop_name)}
                    alt={l.crop_name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <Badge className="absolute left-2 top-2 bg-background/90 text-foreground backdrop-blur">
                    Grade {l.quality_grade || "B"}
                  </Badge>
                </div>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold">{l.crop_name}</h3>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {l.pickup_location || "Farm location"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-primary">₹{l.price_per_kg}</p>
                      <p className="text-[11px] text-muted-foreground">per kg</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                    <span>{l.quantity_kg} kg available</span>
                    <span className="capitalize">{CATEGORY_MAP[l.crop_name] || "produce"}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Active orders + recent */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Truck className="size-5 text-primary" />
              Active orders
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/buyer/orders">
                View all
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : activeOrders.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Truck className="mx-auto size-7 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium">No active orders</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start a procurement to source produce with optimized logistics.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link href="/buyer/procurement">
                    <Plus className="size-4" />
                    New procurement
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((o) => (
                <Card key={o.id} className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        Order #{o.id.slice(0, 8)}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {o.items.reduce((a, i) => a + i.quantity_kg, 0)} kg
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {o.items.length > 0
                          ? `${o.items.length} item${o.items.length > 1 ? "s" : ""} · ${o.items.reduce((a, i) => a + i.quantity_kg, 0)} kg`
                          : "Produce order"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge className={STATUS_TONE[o.status] || "bg-muted text-muted-foreground"}>
                        {STATUS_LABEL[o.status] || o.status}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/buyer/orders/${o.id}`}>
                          Details
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <ClipboardList className="size-5 text-primary" />
              Recent orders
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/buyer/orders">
                View all
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <ClipboardList className="mx-auto size-7 text-muted-foreground/50" />
                <p className="mt-2 text-sm font-medium">No orders yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your procurement history will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <Card key={o.id} className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        Order #{o.id.slice(0, 8)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {" · "}
                        {o.total_amount ? formatINR(o.total_amount) : `${o.items.reduce((a, i) => a + i.quantity_kg, 0)} kg`}
                      </p>
                    </div>
                    <Badge className={STATUS_TONE[o.status] || "bg-muted text-muted-foreground"}>
                      {STATUS_LABEL[o.status] || o.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}