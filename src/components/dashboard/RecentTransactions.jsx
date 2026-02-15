import React from "react";
import { formatCurrency, getCategoryLabel } from "../shared/formatters";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from "lucide-react";
import moment from "moment";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function RecentTransactions({ transactions }) {
  const recent = transactions.slice(0, 8);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Transactions</h3>
        <Link to={createPageUrl("Transactions")} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
          View all →
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No transactions yet. Import your data to get started.</p>
      ) : (
        <div className="space-y-1">
          {recent.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                t.type === "transfer" ? "bg-slate-100" :
                t.amount > 0 ? "bg-emerald-50" : "bg-red-50"
              }`}>
                {t.type === "transfer" ? (
                  <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
                ) : t.amount > 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{t.merchant_clean || t.merchant_raw || "Unknown"}</p>
                <p className="text-[11px] text-slate-400">{moment(t.date).format("MMM D")} · {t.account_name || "—"}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-semibold ${t.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"}`}>
                  {t.amount >= 0 ? "+" : ""}{formatCurrency(t.amount)}
                </p>
                <p className="text-[10px] text-slate-400">{getCategoryLabel(t.category)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}