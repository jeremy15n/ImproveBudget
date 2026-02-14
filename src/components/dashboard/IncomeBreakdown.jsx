import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency, getCategoryLabel, CATEGORY_COLORS } from "../shared/formatters";
import moment from "moment";

export default function IncomeBreakdown({ transactions }) {
  const data = useMemo(() => {
    const currentMonth = moment().format("YYYY-MM");
    const catMap = {};
    transactions
      .filter((t) => t.amount > 0 && moment(t.date).format("YYYY-MM") === currentMonth && t.type !== "transfer")
      .forEach((t) => {
        const cat = t.category || "uncategorized";
        catMap[cat] = (catMap[cat] || 0) + t.amount;
      });
    return Object.entries(catMap)
      .map(([name, value]) => ({ name: getCategoryLabel(name), value, key: name }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Income by Category</h3>
      {data.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">No income data this month</p>
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={40} outerRadius={65} paddingAngle={2} stroke="none">
                {data.map((entry) => (
                  <Cell key={entry.key} fill={CATEGORY_COLORS[entry.key] || "#cbd5e1"} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2 min-w-0">
            {data.slice(0, 5).map((d) => (
              <div key={d.key} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[d.key] || "#cbd5e1" }} />
                  <span className="text-slate-600 truncate">{d.name}</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-medium text-slate-900">{formatCurrency(d.value)}</span>
                  <span className="text-slate-400 ml-1">({((d.value / total) * 100).toFixed(0)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}