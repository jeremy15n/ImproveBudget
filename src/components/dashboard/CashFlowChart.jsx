import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "../shared/formatters";
import moment from "moment";

export default function CashFlowChart({ data = [], isLoading = false }) {
  // Format labels for display
  const chartData = data.map(d => ({
    ...d,
    label: d.period.length === 4
      ? d.period // year format
      : moment(d.period, "YYYY-MM").format("MMM"),
  }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Cash Flow</h3>
      </div>

      {isLoading ? (
        <div className="h-[260px] flex items-center justify-center text-xs text-slate-400">Loading...</div>
      ) : chartData.length === 0 ? (
        <div className="h-[260px] flex items-center justify-center text-xs text-slate-400">No transaction data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, true)} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
              formatter={(v) => formatCurrency(v)}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="income" fill="#22c55e" radius={[6, 6, 0, 0]} name="Income" />
            <Bar dataKey="expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Expenses" />
            <Bar dataKey="savings" fill="#6366f1" radius={[6, 6, 0, 0]} name="Savings" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
