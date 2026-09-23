import React, { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { fetchBuyerInsights, BuyerInsightsData } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  BarChart3,
  IndianRupee,
  Package,
  Scale,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { formatINR, formatKg } from "@/lib/format";

export default function BuyerInsights() {
  const [data, setData] = useState<BuyerInsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchBuyerInsights());
    } catch (e) {
      toast.error("Could not load insights");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Insights are not available yet.</p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/buyer-dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const maxTrend = Math.max(...data.spend_trend.map((p) => p.amount), 1);
  const maxCrop = Math.max(...data.top_crops.map((c) => c.quantity_kg), 1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4 h-auto p-0 text-muted-foreground" asChild>
        <Link href="/buyer-dashboard">
          <ArrowLeft className="size-3.5" />
          Back to dashboard
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BarChart3 className="size-6 text-primary" />
          Procurement insights
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live summary computed from your orders, allocations and shipments.
        </p>
      </div>

      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={<IndianRupee className="size-5" />} label="Total spend" value={formatINR(data.total_spend)} />
        <KpiCard icon={<Package className="size-5" />} label="Volume procured" value={formatKg(data.total_kg)} />
        <KpiCard icon={<ClipboardIcon />} label="Orders placed" value={String(data.total_orders)} />
        <KpiCard
          icon={<Truck className="size-5" />}
          label="On-time delivery"
          value={`${Math.round(data.delivery_performance.on_time_rate * 100)}%`}
          sub={`${data.delivery_performance.delivered_shipments}/${data.delivery_performance.total_shipments} shipments`}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Spend trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly spend</CardTitle>
          </CardHeader>
          <CardContent>
            {data.spend_trend.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No spend data yet.</p>
            ) : (
              <div className="flex h-40 items-end gap-2">
                {data.spend_trend.map((p) => (
                  <div key={p.month} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {p.amount > 0 ? formatINR(p.amount) : ""}
                    </span>
                    <div
                      className="w-full rounded-t bg-primary/80"
                      style={{ height: `${Math.max((p.amount / maxTrend) * 100, 2)}%` }}
                      title={`${p.month}: ${formatINR(p.amount)}`}
                    />
                    <span className="text-[10px] text-muted-foreground">{p.month}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top crops */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top crops by volume</CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_crops.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No delivered crops yet.</p>
            ) : (
              <div className="space-y-3">
                {data.top_crops.map((c) => (
                  <div key={c.crop_name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{c.crop_name}</span>
                      <span className="text-muted-foreground">{formatKg(c.quantity_kg)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(c.quantity_kg / maxCrop) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplier reliability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="size-4 text-primary" />
              Supplier match quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.suppliers.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No supplier allocations yet.</p>
            ) : (
              <div className="space-y-3">
                {data.suppliers.map((s) => (
                  <div key={s.supplier_name} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.supplier_name}</p>
                      <p className="text-xs text-muted-foreground">{s.allocation_count} allocations</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{ width: `${Math.round(s.avg_score * 100)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold">
                        {Math.round(s.avg_score * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="size-4 text-primary" />
              Delivery performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/40 p-3">
                <span className="block text-[11px] text-muted-foreground">On-time rate</span>
                <strong className="text-lg text-emerald-700">
                  {Math.round(data.delivery_performance.on_time_rate * 100)}%
                </strong>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <span className="block text-[11px] text-muted-foreground">Avg landed cost</span>
                <strong className="text-lg">
                  {formatINR(Math.round(data.delivery_performance.avg_landed_cost_per_kg))}
                  <span className="text-xs font-normal text-muted-foreground">/kg</span>
                </strong>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Landed cost includes produce cost plus transport, handling and expected loss — the true
              cost of delivered produce.
            </p>
          </CardContent>
        </Card>
      </div>

      {data.total_orders === 0 && (
        <Empty className="mt-8 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BarChart3 />
            </EmptyMedia>
            <EmptyTitle>No procurement activity yet</EmptyTitle>
            <EmptyDescription>
              Place your first order to start building these insights.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild size="sm">
              <Link href="/buyer/procurement">Start a procurement</Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </span>
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className="mt-3 text-xl font-bold">{value}</p>
        {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function ClipboardIcon() {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}