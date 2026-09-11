"use client";

import RequireRole from "@/components/RequireRole";
import DashboardLayout from "@/components/DashboardLayout";
import { StatCard, PageHeader, EmptyState, StatusBadge } from "@/components/ui";
import { useMarketplaceStore } from "@/store/marketplace";
import { useAuthStore } from "@/store/auth";
import { formatINR, formatDate } from "@/lib/demoData";
import { Wallet, Clock, CheckCircle, TrendingUp } from "lucide-react";

export default function FarmerEarningsPage() {
  return (
    <RequireRole role="farmer">
      <DashboardLayout role="farmer">
        <FarmerEarnings />
      </DashboardLayout>
    </RequireRole>
  );
}

function FarmerEarnings() {
  const { user } = useAuthStore();
  const transactions = useMarketplaceStore((s) => s.transactions);
  const orders = useMarketplaceStore((s) => s.orders);

  const myTransactions = transactions
    .filter((t) => t.farmer_id === user?.id)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const completed = myTransactions.filter((t) => t.status === "completed");
  const pending = myTransactions.filter((t) => t.status === "pending");
  const totalEarnings = completed.reduce((sum, t) => sum + t.amount, 0);
  const pendingEarnings = pending.reduce((sum, t) => sum + t.amount, 0);

  const myOrders = orders.filter((o) =>
    o.items.some((it) => it.seller_id === user?.id)
  );
  const completedSales = myOrders.filter((o) => o.status === "delivered").length;

  // Simple monthly earnings chart data (last 6 months)
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  const monthlyData = [8200, 12400, 9800, 15600, 11900, totalEarnings];
  const maxVal = Math.max(...monthlyData, 1);

  return (
    <div>
      <PageHeader
        title="Earnings"
        subtitle="Track your income from marketplace sales"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Earnings" value={formatINR(totalEarnings)} icon={<Wallet size={20} />} color="green" />
        <StatCard label="Pending Earnings" value={formatINR(pendingEarnings)} icon={<Clock size={20} />} color="amber" />
        <StatCard label="Completed Sales" value={completedSales} icon={<CheckCircle size={20} />} color="blue" />
        <StatCard label="Avg. per Sale" value={completed.length ? formatINR(totalEarnings / completed.length) : "₹0"} icon={<TrendingUp size={20} />} color="purple" />
      </div>

      {/* Earnings chart */}
      <div className="mt-8 rounded-xl border border-green-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Earnings Overview
        </h2>
        <div className="flex h-48 items-end gap-3">
          {monthlyData.map((val, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-medium text-gray-600">
                {formatINR(val)}
              </span>
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-green-600 to-green-400 transition-all"
                style={{ height: `${Math.max((val / maxVal) * 100, 4)}%` }}
              />
              <span className="text-xs text-gray-500">{months[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Recent Transactions
        </h2>
        {myTransactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            message="Your earnings from completed orders will appear here."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-green-100 bg-white shadow-sm">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-green-100 bg-green-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">Transaction</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Order</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-green-50/50">
                    <td className="px-4 py-3 text-gray-600">{txn.description}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      #{txn.order_id}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(txn.created_at)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatINR(txn.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={txn.status === "completed" ? "delivered" : "pending"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}