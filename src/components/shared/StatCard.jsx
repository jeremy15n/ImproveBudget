import React from "react";
import { cn } from "@/lib/utils";

export default function StatCard({ label, value, icon: Icon, trend, trendLabel, className, iconColor = "text-indigo-600", iconBg = "bg-indigo-50" }) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-md transition-shadow duration-300", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
          {(trend !== undefined && trend !== null) && (
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded-md",
                isPositive && "text-emerald-700 bg-emerald-50",
                isNegative && "text-red-700 bg-red-50",
                !isPositive && !isNegative && "text-slate-500 bg-slate-50"
              )}>
                {isPositive && "+"}{typeof trend === 'number' ? trend.toFixed(1) : trend}%
              </span>
              {trendLabel && <span className="text-[11px] text-slate-400">{trendLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
        )}
      </div>
    </div>
  );
}