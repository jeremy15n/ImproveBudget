import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "../shared/formatters";
import { useCategories } from "../../hooks/useCategories";

const SAVINGS_PALETTE = [
  "#6366f1", "#818cf8", "#a78bfa", "#8b5cf6",
  "#7c3aed", "#4f46e5", "#c4b5fd", "#6d28d9",
];

export default function SavingsBreakdown({ transactions, startDate, endDate }) {
  const { getCategoryLabel, getCategoryType } = useCategories();

  const data = useMemo(() => {
    const catMap = {};
    transactions
      .filter((t) => {
        if (t.type === "transfer") return false;
        if (startDate && t.date < startDate) return false;
        if (endDate && t.date > endDate) return false;
        return t.type === "savings" || getCategoryType(t.category) === "savings";
      })
      .forEach((t) => {
        const cat = t.category || "uncategorized";
        catMap[cat] = (catMap[cat] || 0) + Math.abs(t.amount);
      });
    return Object.entries(catMap)
      .map(([name, value]) => ({ name: getCategoryLabel(name), value, key: name }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions, startDate, endDate, getCategoryLabel, getCategoryType]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Savings</h3>
      {data.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">No savings data for this period</p>
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={40} outerRadius={65} paddingAngle={2} stroke="none">
                {data.map((entry, i) => (
                  <Cell key={entry.key} fill={SAVINGS_PALETTE[i % SAVINGS_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2 min-w-0">
            {data.slice(0, 5).map((d, i) => (
              <div key={d.key} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SAVINGS_PALETTE[i % SAVINGS_PALETTE.length] }} />
                  <span className="text-slate-600 dark:text-slate-400 truncate">{d.name}</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(d.value)}</span>
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
