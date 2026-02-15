import React from "react";
import { formatCurrency } from "../shared/formatters";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { AccountIcon } from "../../pages/Accounts";

export default function AccountsSummary({ accounts }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Accounts</h3>
        <Link to={createPageUrl("Accounts")} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
          Manage →
        </Link>
      </div>
      {accounts.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No accounts added yet.</p>
      ) : (
        <div className="space-y-2">
          {accounts.filter(a => a.is_active !== false).sort((a, b) => Math.abs(b.balance || 0) - Math.abs(a.balance || 0)).slice(0, 5).map((acc) => (
            <div key={acc.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <AccountIcon acc={acc} size="w-8 h-8" iconSize="w-4 h-4" textSize="text-xs" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{acc.name}</p>
                <p className="text-[11px] text-slate-400">{acc.account_type?.replace(/_/g, " ")}</p>
              </div>
              <p className={`text-sm font-semibold shrink-0 ${!Boolean(acc.is_asset) ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100"}`}>
                {formatCurrency(acc.balance || 0)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
