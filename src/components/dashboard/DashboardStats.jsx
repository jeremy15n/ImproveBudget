import React from "react";
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { formatCurrency } from "../shared/formatters";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardStats({ netWorth, income, expenses, savingsRate, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  const stats = [
    {
      label: "NET WORTH",
      value: formatCurrency(netWorth),
      icon: DollarSign,
      // Indigo theme (matches Budget page style)
      containerBg: "bg-indigo-100 dark:bg-indigo-500/10",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "INCOME",
      value: formatCurrency(income),
      icon: TrendingUp,
      // Emerald/Green theme
      containerBg: "bg-emerald-100 dark:bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "EXPENSES",
      value: formatCurrency(expenses),
      icon: TrendingDown,
      // Rose/Red theme
      containerBg: "bg-rose-100 dark:bg-rose-500/10",
      iconColor: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "SAVINGS RATE",
      value: `${savingsRate.toFixed(1)}%`,
      icon: PiggyBank,
      // Amber/Orange theme
      containerBg: "bg-amber-100 dark:bg-amber-500/10",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.containerBg}`}>
              <Icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}