import React, { useState, useCallback } from "react";
import { apiClient } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Trash2, X, Tag, RefreshCw, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PiggyBank, Plus, Check, Pencil, Flag } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import RecycleBin from "../components/shared/RecycleBin";
import TransactionFilters from "../components/transactions/TransactionFilters";
import TransactionRow from "../components/transactions/TransactionRow";
import TransactionEditDialog from "../components/transactions/TransactionEditDialog";
import TransactionAddDialog from "../components/transactions/TransactionAddDialog";
import { formatCurrency, getCategoryLabel } from "../components/shared/formatters";
import { useCategories } from "../hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import moment from "moment";

const TYPES = ["income", "expense", "savings", "transfer", "refund"];
const PAGE_SIZES = [50, 100, 200, 500, 1000];

export default function Transactions() {
  const { categoryList } = useCategories();
  const [filters, setFilters] = useState({ search: "", category: "all", type: "all", account: "all", status: "all", sortBy: "-date", dateFrom: "", dateTo: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [editTx, setEditTx] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const qc = useQueryClient();

  const sortBy = filters.sortBy || "-date";

  const serverFilters = {};
  if (filters.category !== "all") serverFilters.category = filters.category;
  if (filters.type !== "all") serverFilters.type = filters.type;
  if (filters.account !== "all") serverFilters.account_id = filters.account;
  if (filters.search) serverFilters.search = filters.search;
  if (filters.status === "flagged") serverFilters.is_flagged = 1;
  if (filters.dateFrom) serverFilters.date_gte = filters.dateFrom;
  if (filters.dateTo) serverFilters.date_lte = filters.dateTo;

  const { data: result, isLoading } = useQuery({
    queryKey: ["transactions", page, pageSize, sortBy, serverFilters],
    queryFn: () => apiClient.entities.Transaction.listPaginated(page, pageSize, sortBy, serverFilters),
    keepPreviousData: true,
  });

  const transactions = result?.data ?? [];
  const meta = result?.meta ?? { total: 0, page: 1, limit: pageSize, totalPages: 1 };

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiClient.entities.Account.list(),
  });

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const handlePageSizeChange = (newSize) => {
    setPageSize(parseInt(newSize));
    setPage(1);
    setSelectedIds(new Set());
  };

  const updateMut = useMutation({
    mutationFn: ({ id, d }) => apiClient.entities.Transaction.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => apiClient.entities.Transaction.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const bulkUpdateMut = useMutation({
    mutationFn: ({ ids, data }) => apiClient.entities.Transaction.bulkUpdate(ids, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setSelectedIds(new Set());
    },
  });

  const createMut = useMutation({
    mutationFn: (items) =>
      items.length === 1
        ? apiClient.entities.Transaction.create(items[0])
        : apiClient.entities.Transaction.bulkCreate(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const bulkDeleteMut = useMutation({
    mutationFn: (ids) => apiClient.entities.Transaction.bulkDelete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
    },
  });

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map(t => t.id)));
    }
  };

  const handleBulkCategory = (category) => {
    const ids = Array.from(selectedIds);
    bulkUpdateMut.mutate({ ids, data: { category } });
  };

  const handleBulkType = (type) => {
    const ids = Array.from(selectedIds);
    bulkUpdateMut.mutate({ ids, data: { type } });
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    bulkDeleteMut.mutate(ids);
  };

  const startItem = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const endItem = Math.min(meta.page * meta.limit, meta.total);

  // Helper component for the custom checkbox
  const CustomCheckbox = ({ checked, onChange }) => (
    <div 
      onClick={onChange}
      className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors shrink-0
        ${checked 
          ? "bg-indigo-600 border-indigo-600 text-white" 
          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
        }`}
    >
      {checked && <Check className="w-3 h-3" strokeWidth={3} />}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={`${meta.total} transactions`}
        icon={ArrowLeftRight}
        actions={
          <div className="flex items-center gap-2">
            <RecycleBin
              entityName="Transaction"
              apiEntity={apiClient.entities.Transaction}
              queryKey={["transactions"]}
              renderRow={(tx) => (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {tx.merchant_clean || tx.merchant_raw || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {tx.date} · {formatCurrency(tx.amount)}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    Deleted {moment(tx.deleted_at).fromNow()}
                  </span>
                </div>
              )}
            />
            <Button className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Transaction
            </Button>
          </div>
        }
      />
      <TransactionFilters filters={filters} setFilters={handleFilterChange} accounts={accounts} />

      {meta.total > 0 && (
        <div className="flex items-center justify-between mb-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-2.5 px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="text-slate-900 dark:text-slate-100">{startItem}–{endItem}</span> of {meta.total}
            </span>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Show</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-16 h-7 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map(s => (
                    <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 mr-2">
              Page {meta.page} of {meta.totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 border-slate-200 dark:border-slate-700"
                disabled={meta.page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 border-slate-200 dark:border-slate-700"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="mb-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-3 flex items-center gap-3 flex-wrap animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{selectedIds.size} selected</span>

          <Select onValueChange={handleBulkCategory}>
            <SelectTrigger className="w-44 h-8 text-xs bg-white dark:bg-slate-800 dark:border-slate-700">
              <Tag className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Change Category" />
            </SelectTrigger>
            <SelectContent>
              {categoryList.map((c) => (
                <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={handleBulkType}>
            <SelectTrigger className="w-40 h-8 text-xs bg-white dark:bg-slate-800 dark:border-slate-700">
              <RefreshCw className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Change Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!showDeleteConfirm ? (
            <Button variant="outline" size="sm" className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="w-3 h-3 mr-1" /> Delete Selected
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">Delete {selectedIds.size} transactions?</span>
              <Button size="sm" className="h-7 text-xs bg-red-600 hover:bg-red-700 dark:bg-red-700" onClick={handleBulkDelete}>Confirm</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs dark:border-slate-700" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            </div>
          )}

          <Button variant="ghost" size="sm" className="h-8 text-xs ml-auto dark:text-slate-400 dark:hover:text-slate-200" onClick={() => { setSelectedIds(new Set()); setShowDeleteConfirm(false); }}>
            <X className="w-3 h-3 mr-1" /> Deselect All
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : transactions.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No transactions found" description="Adjust your filters or import data." />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          <div className="flex items-center gap-3 py-2 px-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
            {/* Custom Checkbox for Select All */}
            <CustomCheckbox 
              checked={selectedIds.size === transactions.length && transactions.length > 0} 
              onChange={toggleSelectAll} 
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Select All on Page</span>
          </div>
          {transactions.map((t) => {
            const isSavings = t.type === 'savings';
            const isIncome = t.amount > 0 && !isSavings;
            
            // Logic for Icon and Color
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
              <div key={t.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                {/* Custom Checkbox for Row */}
                <CustomCheckbox 
                  checked={selectedIds.has(t.id)} 
                  onChange={() => toggleSelect(t.id)} 
                />
                
                {/* ICON CIRCLE */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2" onClick={() => setEditTx(t)}>
                  <div className="cursor-pointer">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 truncate">{t.merchant_clean || t.merchant_raw}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{moment(t.date).format("MMM D, YYYY")}</p>
                  </div>
                  <div className="flex items-center md:justify-end gap-3 cursor-pointer">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                      {t.category ? getCategoryLabel(t.category) : "Uncategorized"}
                    </span>
                    <span className={`text-sm font-bold ${textColorClass}`}>
                      {sign}{formatCurrency(Math.abs(t.amount))}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className={`h-7 w-7 ${t.is_flagged ? "text-amber-500" : "text-slate-400 hover:text-amber-500"}`} onClick={() => updateMut.mutate({ id: t.id, d: { is_flagged: t.is_flagged ? 0 : 1 } })}>
                    <Flag className="w-3.5 h-3.5" fill={t.is_flagged ? "currentColor" : "none"} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-500" onClick={() => setEditTx(t)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => deleteMut.mutate(t.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TransactionEditDialog
        transaction={editTx}
        open={!!editTx}
        onClose={() => setEditTx(null)}
        onSave={(data) => updateMut.mutate({ id: data.id, d: data })}
        accounts={accounts}
      />

      <TransactionAddDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSave={(items) => createMut.mutate(items)}
        accounts={accounts}
      />
    </div>
  );
}