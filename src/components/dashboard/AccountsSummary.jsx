import React from "react";
import { formatCurrency, INSTITUTION_COLORS } from "../shared/formatters";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function AccountsSummary({ accounts }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Accounts</h3>
        <Link to={createPageUrl("Accounts")} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
          Manage →
        </Link>
      </div>
      {accounts.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No accounts added yet.</p>
      ) : (
        <div className="space-y-2">
          {accounts.filter(a => a.is_active !== false).map((acc) => (
            <div key={acc.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: acc.color || INSTITUTION_COLORS[acc.institution] || "#94a3b8" }}
              >
                {(acc.institution || "?")[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{acc.name}</p>
                <p className="text-[11px] text-slate-400">{acc.institution} · {acc.account_type?.replace(/_/g, " ")}</p>
              </div>
              <p className={`text-sm font-semibold shrink-0 ${acc.is_asset === false ? "text-red-600" : "text-slate-900"}`}>
                {formatCurrency(acc.balance || 0)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}