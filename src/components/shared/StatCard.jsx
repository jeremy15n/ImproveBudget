import React from "react";
import { cn } from "@/lib/utils";

export default function StatCard({ label, value, icon: Icon, trend, trendLabel, className, iconColor = "text-indigo-600", iconBg = "bg-indigo-50" }) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl hover:shadow-md transition-shadow duration-300", 
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">{value}</p>
          {(trend !== undefined && trend !== null) && (
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded-md",
                isPositive && "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10",
                isNegative && "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-500/10",
                !isPositive && !isNegative && "text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-800"
              )}>
                {isPositive && "+"}{typeof trend === 'number' ? trend.toFixed(1) : trend}%
              </span>
              {trendLabel && <span className="text-[11px] text-slate-400 dark:text-slate-500">{trendLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center", 
            // In dark mode, we use a subtle transparent indigo background
            iconBg === "bg-indigo-50" ? "bg-indigo-50 dark:bg-indigo-500/10" : iconBg,
            iconColor === "text-indigo-600" ? "text-indigo-600 dark:text-indigo-400" : iconColor
          )}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}