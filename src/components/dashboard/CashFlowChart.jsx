import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "../shared/formatters";
import moment from "moment";

export default function CashFlowChart({ transactions }) {
  const data = useMemo(() => {
    const monthMap = {};
    const now = moment();
    for (let i = 5; i >= 0; i--) {
      const m = now.clone().subtract(i, "months").format("YYYY-MM");
      monthMap[m] = { month: m, label: now.clone().subtract(i, "months").format("MMM"), income: 0, expenses: 0 };
    }
    transactions.forEach((t) => {
      const m = moment(t.date).format("YYYY-MM");
      if (monthMap[m]) {
        if (t.amount > 0 && t.type !== "transfer") monthMap[m].income += t.amount;
        else if (t.amount < 0 && t.type !== "transfer") monthMap[m].expenses += Math.abs(t.amount);
      }
    });
    return Object.values(monthMap);
  }, [transactions]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Cash Flow — Last 6 Months</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barGap={4}>
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
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}