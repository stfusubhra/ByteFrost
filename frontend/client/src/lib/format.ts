/* KisanSetu shared formatting helpers.
 *
 * One place for INR amounts, dates, quantities and status labels so every
 * page renders the same format (e.g. "27 Aug 2026 · 11:50 AM") and no page
 * leaks raw ISO timestamps to the UI.
 */

/** Format a number as Indian Rupees, e.g. 40062.5 -> "₹40,063". */
export function formatINR(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

/** Format a number as Indian Rupees with paise, e.g. 45 -> "₹45.00". */
export function formatINRExact(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format a quantity in kg, e.g. 500 -> "500 kg". */
export function formatKg(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${n.toLocaleString("en-IN")} kg`;
}

/** Format an ISO timestamp as "27 Aug 2026 · 11:50 AM". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format an ISO timestamp as "27 Aug 2026". */
export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Human-friendly relative label for a harvest date, e.g. "Today", "2 days ago". */
export function harvestLabel(iso: string | null | undefined): string {
  if (!iso) return "Harvest date TBA";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Harvest date TBA";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "Harvested today";
  if (days === 1) return "Harvested yesterday";
  return `Harvested ${days} days ago`;
}

/** Tailwind badge tone for an order/shipment status. */
export function statusTone(status: string | null | undefined): string {
  const s = (status || "").toLowerCase();
  if (["delivered", "completed", "confirmed", "active"].includes(s)) return "bg-emerald-100 text-emerald-800";
  if (["in_transit", "dispatched", "pending", "planned"].includes(s)) return "bg-amber-100 text-amber-800";
  if (["cancelled", "failed", "infeasible"].includes(s)) return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-700";
}

/** Human label for an order/shipment status. */
export function statusLabel(status: string | null | undefined): string {
  const s = (status || "").toLowerCase();
  const labels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    dispatched: "Dispatched",
    in_transit: "In transit",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    failed: "Failed",
    planned: "Planned",
    active: "Active",
  };
  return labels[s] || status || "—";
}