import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, ArrowUpDown, X } from "lucide-react";
import { useCategories } from "../../hooks/useCategories";

const TYPES = ["all", "income", "expense", "savings", "transfer", "refund"];
const SORT_OPTIONS = [
  { value: "-date", label: "Newest First" },
  { value: "date", label: "Oldest First" },
  { value: "-amount", label: "Amount (High → Low)" },
  { value: "amount", label: "Amount (Low → High)" },
];

export default function TransactionFilters({ filters, setFilters, accounts }) {
  const { categoryList, getCategoryLabel } = useCategories();
  const hasDateFilter = filters.dateFrom || filters.dateTo;

  const clearDates = () => {
    setFilters({ ...filters, dateFrom: "", dateTo: "" });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4 mb-4 space-y-3">
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search transactions..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        {/* Category Filter */}
        <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryList.map((c) => (
              <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
          <SelectTrigger className="w-[130px] text-slate-700">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>

        {/* Account Filter */}
        <Select value={filters.account} onValueChange={(v) => setFilters({ ...filters, account: v })}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={filters.sortBy || "-date"} onValueChange={(v) => setFilters({ ...filters, sortBy: v })}>
          <SelectTrigger className="w-[180px]">
            <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-slate-400" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">Date Range:</span>
        <Input
          type="date"
          value={filters.dateFrom || ""}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          className="w-[155px] h-8 text-xs"
          placeholder="From"
        />
        <span className="text-xs text-slate-400">to</span>
        <Input
          type="date"
          value={filters.dateTo || ""}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          className="w-[155px] h-8 text-xs"
          placeholder="To"
        />
        {hasDateFilter && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2" onClick={clearDates}>
            <X className="w-3 h-3 mr-1" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}