import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Truck,
  MapPin,
  RefreshCw,
  Send,
  Navigation,
} from "lucide-react";
import { TrackingEventItem, postTrackingEvent, reportShipmentIncident } from "@/lib/api";
import { toast } from "sonner";

interface TrackingTimelineProps {
  shipmentId: string;
  currentStatus: string;
  events: TrackingEventItem[];
  estimatedArrival?: string | null;
  currentLat?: number | null;
  currentLng?: number | null;
  onRefresh?: () => void;
}

export default function TrackingTimeline({
  shipmentId,
  currentStatus,
  events = [],
  estimatedArrival,
  currentLat,
  currentLng,
  onRefresh,
}: TrackingTimelineProps) {
  const [reportingIncident, setReportingIncident] = useState(false);
  const [incidentType, setIncidentType] = useState<"TRUCK_BREAKDOWN" | "FARMER_CANCELLED">("TRUCK_BREAKDOWN");
  const [incidentNotes, setIncidentNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const handleSimulateCheckpoint = async (eventType: string, label: string) => {
    try {
      await postTrackingEvent(shipmentId, {
        event_type: eventType,
        latitude: currentLat || undefined,
        longitude: currentLng || undefined,
        notes: `Milestone checkpoint: ${label}`,
      });
      toast.success(`Checkpoint updated: ${label}`);
      onRefresh?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to update checkpoint");
    }
  };

  const handleReportIncident = async () => {
    setSubmitting(true);
    try {
      await reportShipmentIncident(shipmentId, {
        incident_type: incidentType,
        latitude: currentLat || 22.5726,
        longitude: currentLng || 88.3639,
        notes: incidentNotes || `Reported ${incidentType} incident.`,
      });
      toast.success(`Incident reported. Automated re-routing triggered!`);
      setReportingIncident(false);
      setIncidentNotes("");
      onRefresh?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to report incident");
    } finally {
      setSubmitting(false);
    }
  };

  // Canonical milestone definitions
  const milestones = [
    { key: "PLANNED", label: "Route Planned" },
    { key: "TRUCK_ASSIGNED", label: "Truck Assigned" },
    { key: "PICKUP_DONE", label: "Pickups Completed" },
    { key: "IN_TRANSIT", label: "In Transit" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  const hasEvent = (type: string) => events.some((e) => e.event_type.toUpperCase() === type);
  const isDelivered = currentStatus.toLowerCase() === "delivered" || hasEvent("DELIVERED");

  return (
    <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Shipment Tracking</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                isDelivered
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : currentStatus.toLowerCase().includes("rerout")
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
              }`}
            >
              {currentStatus}
            </span>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            ID: {shipmentId}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {estimatedArrival && (
            <div className="text-xs text-right mr-2">
              <div className="text-muted-foreground">Est. Arrival</div>
              <div className="font-semibold text-foreground">{formatDateTime(estimatedArrival)}</div>
            </div>
          )}
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border hover:bg-muted transition-colors text-muted-foreground"
            title="Refresh Tracking"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Milestone Step Progress Bar */}
      <div className="relative">
        <div className="grid grid-cols-5 gap-2">
          {milestones.map((m, idx) => {
            const completed = hasEvent(m.key) || (isDelivered && idx < 4);
            return (
              <div key={m.key} className="flex flex-col items-center text-center space-y-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    completed
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground border"
                  }`}
                >
                  {completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
                </div>
                <span className="text-[11px] font-medium leading-tight text-foreground">
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Events Stream / Log */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Timeline Events ({events.length})
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No events recorded yet.</p>
        ) : (
          <div className="space-y-3 border-l-2 border-muted pl-4 ml-2">
            {events.map((ev, idx) => {
              const isIncident = ev.event_type.includes("BREAKDOWN") || ev.event_type.includes("CANCEL");
              const isReroute = ev.event_type.includes("REROUTE");
              return (
                <div key={ev.id || idx} className="relative space-y-0.5">
                  <div
                    className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${
                      isIncident
                        ? "bg-destructive"
                        : isReroute
                        ? "bg-amber-500"
                        : "bg-primary"
                    }`}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      {ev.event_type.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateTime(ev.timestamp)}
                    </span>
                  </div>
                  {ev.notes && (
                    <p className="text-xs text-muted-foreground">{ev.notes}</p>
                  )}
                  {ev.latitude && ev.longitude && (
                    <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 pt-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {ev.latitude.toFixed(4)}, {ev.longitude.toFixed(4)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Checkpoints & Incident Reporting Drawer */}
      <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleSimulateCheckpoint("PICKUP_DONE", "Pickups complete")}
            className="text-xs px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
          >
            Mark Picked Up
          </button>
          <button
            onClick={() => handleSimulateCheckpoint("IN_TRANSIT", "On road")}
            className="text-xs px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
          >
            Mark In Transit
          </button>
          <button
            onClick={() => handleSimulateCheckpoint("DELIVERED", "Delivered successfully")}
            className="text-xs px-2.5 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 transition-colors font-medium"
          >
            Mark Delivered
          </button>
        </div>

        <button
          onClick={() => setReportingIncident(!reportingIncident)}
          className="text-xs px-3 py-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Report Incident</span>
        </button>
      </div>

      {/* Incident Form Drawer */}
      {reportingIncident && (
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 space-y-3 animate-in fade-in duration-200">
          <div className="text-xs font-semibold text-amber-900 dark:text-amber-200">
            Report Transit Incident & Re-Optimize
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value as any)}
              className="text-xs p-2 rounded border bg-background text-foreground"
            >
              <option value="TRUCK_BREAKDOWN">Truck Breakdown (Dispatch Backup)</option>
              <option value="FARMER_CANCELLED">Farmer Cancelled Pickup</option>
            </select>
            <input
              type="text"
              placeholder="Incident details / notes..."
              value={incidentNotes}
              onChange={(e) => setIncidentNotes(e.target.value)}
              className="text-xs p-2 rounded border bg-background text-foreground"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setReportingIncident(false)}
              className="text-xs px-3 py-1 rounded border text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleReportIncident}
              disabled={submitting}
              className="text-xs px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center gap-1"
            >
              {submitting ? "Processing..." : "Trigger Re-Optimization"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
