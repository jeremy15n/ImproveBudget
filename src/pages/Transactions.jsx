import React, { useState, useCallback } from "react";
import { apiClient } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Trash2, X, Tag, RefreshCw, ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
const PAGE_SIZES = [50, 100, 200];

export default function Transactions() {
  const { categoryList } = useCategories();
  const [filters, setFilters] = useState({ search: "", category: "all", type: "all", account: "all", status: "all" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [editTx, setEditTx] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const qc = useQueryClient();

  // Build server-side filters
  const serverFilters = {};
  if (filters.category !== "all") serverFilters.category = filters.category;
  if (filters.type !== "all") serverFilters.type = filters.type;
  if (filters.account !== "all") serverFilters.account_id = filters.account;
  if (filters.search) serverFilters.search = filters.search;
  
  // FIX: Send 1 instead of true for SQLite compatibility
  if (filters.status === "flagged") serverFilters.is_flagged = 1;

  const { data: result, isLoading } = useQuery({
    queryKey: ["transactions", page, pageSize, serverFilters],
    queryFn: () => apiClient.entities.Transaction.listPaginated(page, pageSize, "-date", serverFilters),
    keepPreviousData: true,
  });

  const transactions = result?.data ?? [];
  const meta = result?.meta ?? { total: 0, page: 1, limit: pageSize, totalPages: 1 };

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiClient.entities.Account.list(),
  });

  // Reset to page 1 when filters change
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
    const toFlip = transactions.filter(t => selectedIds.has(t.id)).filter(t => {
      if (type === 'expense' && t.amount > 0) return true;
      if (type === 'income' && t.amount < 0) return true;
      return false;
    });
    if (toFlip.length > 0) {
      for (const t of toFlip) {
        apiClient.entities.Transaction.update(t.id, { amount: -t.amount });
      }
      setTimeout(() => qc.invalidateQueries({ queryKey: ["transactions"] }), 500);
    }
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    bulkDeleteMut.mutate(ids);
  };

  // Pagination display calculation
  const startItem = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const endItem = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={`${meta.total} transactions`}
        actions={
          <div className="flex items-center gap-2">
            <RecycleBin
              entityName="Transaction"
              apiEntity={apiClient.entities.Transaction}
              queryKey={["transactions"]}
              renderRow={(tx) => (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
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
            <Button className="bg-indigo-600 hover:bg-indigo-700" size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Transaction
            </Button>
          </div>
        }
      />
      <TransactionFilters filters={filters} setFilters={handleFilterChange} accounts={accounts} />

      {/* Pagination Controls - TOP */}
      {meta.total > 0 && (
        <div className="flex items-center justify-between mb-4 bg-white rounded-2xl border border-slate-200/60 p-2.5 px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Showing <span className="text-slate-900">{startItem}–{endItem}</span> of {meta.total}
            </span>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Show</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-16 h-7 text-xs bg-slate-50 border-slate-200">
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
                className="h-7 w-7 border-slate-200"
                disabled={meta.page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 border-slate-200"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-3 bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3 flex-wrap animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="text-sm font-medium text-indigo-700">{selectedIds.size} selected</span>

          <Select onValueChange={handleBulkCategory}>
            <SelectTrigger className="w-44 h-8 text-xs bg-white">
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
            <SelectTrigger className="w-40 h-8 text-xs bg-white">
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
            <Button variant="outline" size="sm" className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="w-3 h-3 mr-1" /> Delete Selected
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-medium">Delete {selectedIds.size} transactions?</span>
              <Button size="sm" className="h-7 text-xs bg-red-600 hover:bg-red-700" onClick={handleBulkDelete}>Confirm</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            </div>
          )}

          <Button variant="ghost" size="sm" className="h-8 text-xs ml-auto" onClick={() => { setSelectedIds(new Set()); setShowDeleteConfirm(false); }}>
            <X className="w-3 h-3 mr-1" /> Deselect All
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : transactions.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No transactions found" description="Adjust your filters or import data." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 divide-y divide-slate-100">
          {/* Select All header */}
          <div className="flex items-center gap-3 py-2 px-3 bg-slate-50/50 rounded-t-2xl">
            <input
              type="checkbox"
              checked={selectedIds.size === transactions.length && transactions.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs text-slate-500 font-medium">Select All on Page</span>
          </div>
          {transactions.map((t) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              selected={selectedIds.has(t.id)}
              onToggleSelect={toggleSelect}
              onEdit={setEditTx}
              onToggleFlag={(tx) => updateMut.mutate({ id: tx.id, d: { is_flagged: !tx.is_flagged } })}
              onDelete={(tx) => deleteMut.mutate(tx.id)}
            />
          ))}
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