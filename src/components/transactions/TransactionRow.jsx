import React from "react";
import { formatCurrency } from "../shared/formatters";
import { useCategories } from "../../hooks/useCategories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Flag, Check, ArrowLeftRight, AlertTriangle, RotateCw, Trash2 } from "lucide-react";
import moment from "moment";

export default function TransactionRow({ transaction: t, onEdit, onToggleReview, onToggleFlag, onDelete, selected, onToggleSelect }) {
  const { categoryColors, getCategoryLabel } = useCategories();
  return (
    <div className={`flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-slate-50 transition-colors ${t.is_duplicate ? "opacity-50" : ""} ${t.is_flagged ? "border-l-2 border-amber-400" : ""} ${selected ? "bg-indigo-50" : ""}`}>
      {onToggleSelect && (
        <input
          type="checkbox"
          checked={selected || false}
          onChange={() => onToggleSelect(t.id)}
          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
        />
      )}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        t.is_transfer ? "bg-slate-100" :
        t.amount > 0 ? "bg-emerald-50" : "bg-red-50"
      }`}>
        {t.is_transfer ? <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" /> :
         t.is_recurring ? <RotateCw className="w-3.5 h-3.5 text-indigo-500" /> :
         t.amount > 0 ? <span className="text-xs font-bold text-emerald-600">+</span> :
         <span className="text-xs font-bold text-red-500">−</span>}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-800 truncate">{t.merchant_clean || t.merchant_raw || "Unknown"}</p>
          {t.is_duplicate && <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600">Duplicate</Badge>}
          {t.is_flagged && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-slate-400">{moment(t.date).format("MMM D, YYYY")}</span>
          <span className="text-[11px] text-slate-300">·</span>
          <span className="text-[11px] text-slate-400">{t.account_name || "—"}</span>
        </div>
      </div>

      <Badge
        variant="secondary"
        className="text-[10px] shrink-0"
        style={{ backgroundColor: `${categoryColors[t.category] || "#cbd5e1"}20`, color: categoryColors[t.category] || "#64748b" }}
      >
        {getCategoryLabel(t.category)}
      </Badge>

      <p className={`text-sm font-semibold w-24 text-right shrink-0 ${t.amount >= 0 ? "text-emerald-600" : "text-slate-900"}`}>
        {t.amount >= 0 ? "+" : ""}{formatCurrency(t.amount)}
      </p>

      <div className="flex items-center gap-0.5 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleReview(t)}>
          <Check className={`w-3.5 h-3.5 ${t.is_reviewed ? "text-emerald-500" : "text-slate-300"}`} />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleFlag(t)}>
          <Flag className={`w-3.5 h-3.5 ${t.is_flagged ? "text-amber-500" : "text-slate-300"}`} />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(t)}>
          <Pencil className="w-3.5 h-3.5 text-slate-400" />
        </Button>
        {onDelete && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(t)}>
            <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
          </Button>
        )}
      </div>
    </div>
  );
}