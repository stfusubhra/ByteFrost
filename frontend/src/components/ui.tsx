"use client";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  color = "green",
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: "green" | "amber" | "blue" | "red" | "purple";
}) {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="rounded-xl border border-green-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", colors[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    processing: "bg-purple-50 text-purple-700 border-purple-200",
    shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
    in_transit: "bg-indigo-50 text-indigo-700 border-indigo-200",
    delivered: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    active: "bg-green-50 text-green-700 border-green-200",
    inactive: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const labels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    in_transit: "In Transit",
    delivered: "Delivered",
    cancelled: "Cancelled",
    active: "Active",
    inactive: "Inactive",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        styles[status] || "bg-gray-100 text-gray-600 border-gray-200"
      )}
    >
      {labels[status] || status}
    </span>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-green-200 bg-white px-6 py-16 text-center">
      <div className="mb-3 text-4xl">🌾</div>
      <h3 className="mb-1 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-gray-500">{message}</p>
      {action}
    </div>
  );
}

export function LoadingSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-gray-500">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
        {label}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-green-800">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function OrderProgress({ status }: { status: string }) {
  const steps = [
    { key: "pending", label: "Placed" },
    { key: "confirmed", label: "Confirmed" },
    { key: "processing", label: "Processing" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
  ];

  const currentIndex = steps.findIndex((s) => s.key === status);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="flex items-center">
      {steps.map((step, i) => (
        <div key={step.key} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold",
                i <= activeIndex
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-gray-300 bg-white text-gray-400"
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn(
                "mt-1 text-[10px] font-medium sm:text-xs",
                i <= activeIndex ? "text-green-700" : "text-gray-400"
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "mx-1 h-0.5 flex-1 sm:mx-2",
                i < activeIndex ? "bg-green-600" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
