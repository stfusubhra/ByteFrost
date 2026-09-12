import React, { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { fetchOrders, OrderResponse } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ClipboardList, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
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

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function formatINR(n: number): string {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function BuyerOrders() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOrders({ status: filter || undefined, limit: 50 });
      setOrders(data);
    } catch (e) {
      toast.error("Could not load orders");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4 h-auto p-0 text-muted-foreground" asChild>
        <Link href="/buyer-dashboard">
          <ArrowLeft className="size-3.5" />
          Back to dashboard
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order history</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All procurement orders with status, volume and value.
          </p>
        </div>
        <Button asChild>
          <Link href="/buyer/procurement">
            <Package className="size-4" />
            New procurement
          </Link>
        </Button>
      </div>

      {/* Status filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:border-primary/50"
            )}
            aria-pressed={filter === f.value}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardList />
            </EmptyMedia>
            <EmptyTitle>No orders found</EmptyTitle>
            <EmptyDescription>
              {filter
                ? `No ${STATUS_LABEL[filter]?.toLowerCase()} orders yet.`
                : "You haven't placed any procurement orders yet."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild size="sm">
              <Link href="/buyer/procurement">
                <Package className="size-4" />
                Start a procurement
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const totalKg = o.items.reduce((a, i) => a + i.quantity_kg, 0);
            return (
              <Card key={o.id} className="transition-colors hover:border-primary/40">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">Order #{o.id.slice(0, 8)}</p>
                      <Badge className={STATUS_TONE[o.status] || "bg-muted text-muted-foreground"}>
                        {STATUS_LABEL[o.status] || o.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" · "}
                      {totalKg} kg
                      {o.total_amount ? ` · ${formatINR(o.total_amount)}` : ""}
                    </p>
                    {o.delivery_address && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground/80">
                        Deliver to: {o.delivery_address}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/buyer/orders/${o.id}`}>
                      View details
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}