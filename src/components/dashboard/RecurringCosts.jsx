import React, { useMemo, useState } from "react";
import { formatCurrency } from "../shared/formatters";
import { RefreshCw } from "lucide-react";

export default function RecurringCosts({ transactions }) {
  const [view, setView] = useState("monthly");

  const recurring = useMemo(() => {
    // Group transactions by merchant + rounded amount to find recurring charges
    const merchantMap = {};
    for (const t of transactions) {
      if (t.amount >= 0 || t.type === "transfer") continue;
      const name = t.merchant_clean || t.merchant_raw || t.description || "";
      if (!name) continue;
      const key = `${name.toLowerCase()}|${Math.abs(t.amount).toFixed(2)}`;
      if (!merchantMap[key]) {
        merchantMap[key] = { name, amount: Math.abs(t.amount), months: new Set() };
      }
      const month = t.date?.slice(0, 7);
      if (month) merchantMap[key].months.add(month);
    }

    // A charge is "recurring" if it appears in 2+ distinct months
    return Object.values(merchantMap)
      .filter((item) => item.months.size >= 2)
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const monthlyTotal = recurring.reduce((s, r) => s + r.amount, 0);
  const yearlyTotal = monthlyTotal * 12;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recurring Costs</h3>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setView("monthly")}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              view === "monthly"
                ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setView("yearly")}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              view === "yearly"
                ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Stats header */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <div>
          <p className="text-[11px] text-slate-400">Monthly Total</p>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(monthlyTotal)}</p>
        </div>
        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
        <div>
          <p className="text-[11px] text-slate-400">Yearly Projection</p>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(yearlyTotal)}</p>
        </div>
      </div>

      {recurring.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8 flex-1">No recurring costs detected yet</p>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto">
          {recurring.slice(0, 10).map((item, i) => (
            <div key={i} className="flex items-center justify-between group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                  {item.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{item.name}</p>
                  <p className="text-[11px] text-slate-400">{item.months.size} months detected</p>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 shrink-0 ml-2">
                {formatCurrency(view === "yearly" ? item.amount * 12 : item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
