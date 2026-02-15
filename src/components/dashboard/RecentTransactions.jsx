import React from "react";
import { formatCurrency } from "../shared/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import moment from "moment";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react"; // Added PiggyBank

export default function RecentTransactions({ transactions, isLoading }) {
  if (isLoading) return <Skeleton className="h-[300px] w-full rounded-2xl" />;

  const recent = transactions.slice(0, 8);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Transactions</h3>
        <Link to="/Transactions" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
          View all
        </Link>
      </div>
      
      <div className="space-y-5 flex-1">
        {recent.map(t => {
            const isSavings = t.type === 'savings';
            const isIncome = t.amount > 0 && !isSavings;
            
            // Determine Styles based on Type
            let Icon = TrendingDown;
            let colorClass = "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400";
            let textColorClass = "text-slate-900 dark:text-slate-100";
            let sign = "";

            if (isSavings) {
                Icon = PiggyBank;
                colorClass = "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
                textColorClass = "text-indigo-600 dark:text-indigo-400";
            } else if (isIncome) {
                Icon = TrendingUp;
                colorClass = "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
                textColorClass = "text-emerald-600 dark:text-emerald-400";
                sign = "+";
            }

            return (
              <div key={t.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {t.merchant_clean || t.merchant_raw}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {moment(t.date).format("MMM D")} · {t.category ? t.category.replace(/_/g, " ") : "Uncategorized"}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-bold whitespace-nowrap ${textColorClass}`}>
                  {sign}{formatCurrency(Math.abs(t.amount))}
                </span>
              </div>
            );
        })}
      </div>
    </div>
  );
}