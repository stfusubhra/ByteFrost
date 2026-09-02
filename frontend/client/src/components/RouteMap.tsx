import React from "react";
import {
  MapPin,
  Truck,
  Building2,
  Navigation,
  ExternalLink,
  Clock,
  Weight,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { RouteStopItem, VehicleItem } from "@/lib/api";

interface RouteMapProps {
  stops: RouteStopItem[];
  vehicle?: VehicleItem | null;
  distanceKm?: number | null;
  durationMin?: number | null;
  routeMode?: string | null;
  mapsUrl?: string | null;
}

export default function RouteMap({
  stops,
  vehicle,
  distanceKm,
  durationMin,
  routeMode = "direct",
  mapsUrl,
}: RouteMapProps) {
  if (!stops || stops.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed rounded-xl text-muted-foreground">
        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No route waypoints available for this shipment.</p>
      </div>
    );
  }

  // Calculate formatted duration
  const hours = durationMin ? Math.floor(durationMin / 60) : 0;
  const mins = durationMin ? Math.round(durationMin % 60) : 0;
  const formattedDuration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-5">
      {/* Top Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50">
              <Navigation className="w-3 h-3" />
              {(routeMode || "direct").toUpperCase()} ROUTE
            </span>
            {vehicle && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border">
                <Truck className="w-3 h-3" />
                {vehicle.vehicle_type} ({vehicle.capacity_kg} kg)
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Optimized with Google OR-Tools multi-stop capacitated routing.
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {distanceKm !== undefined && distanceKm !== null && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Est. Distance</div>
              <div className="font-semibold text-foreground">{distanceKm} km</div>
            </div>
          )}
          {durationMin !== undefined && durationMin !== null && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Travel Time</div>
              <div className="font-semibold text-foreground">{formattedDuration}</div>
            </div>
          )}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
            >
              <span>Driver GPS</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Visual Sequence Flow */}
      <div className="relative pt-2">
        <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
          Sequence of Stops ({stops.length})
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stops.map((stop, idx) => {
            const isPickup = stop.stop_type === "PICKUP";
            const isHub = stop.stop_type === "HUB";
            const isDrop = stop.stop_type === "DROP";

            const etaFormatted = stop.eta
              ? new Date(stop.eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : null;

            return (
              <div
                key={stop.id || idx}
                className={`relative flex flex-col justify-between p-3.5 rounded-xl border transition-all hover:shadow-md ${
                  isDrop
                    ? "bg-emerald-50/40 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-800/40"
                    : isHub
                    ? "bg-amber-50/40 border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-800/40"
                    : "bg-background border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isDrop
                          ? "bg-emerald-600 text-white"
                          : isHub
                          ? "bg-amber-500 text-white"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {stop.sequence || idx + 1}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {stop.stop_type}
                    </span>
                  </div>

                  {etaFormatted && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3" />
                      {etaFormatted}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Weight className="w-3 h-3 text-muted-foreground" />
                      Quantity:
                    </span>
                    <span className="font-semibold text-foreground">
                      {stop.quantity_kg} kg
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-muted-foreground truncate">
                    {stop.latitude?.toFixed(4)}, {stop.longitude?.toFixed(4)}
                  </div>
                </div>

                {idx < stops.length - 1 && (
                  <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 bg-background border rounded-full p-0.5 shadow-sm text-muted-foreground">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
