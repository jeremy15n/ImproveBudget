import React, { useState, useMemo } from "react";
import { apiClient } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Trash2, X, Tag, RefreshCw } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import TransactionFilters from "../components/transactions/TransactionFilters";
import TransactionRow from "../components/transactions/TransactionRow";
import TransactionEditDialog from "../components/transactions/TransactionEditDialog";
import { formatCurrency, getCategoryLabel, CATEGORY_COLORS } from "../components/shared/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["housing", "transportation", "food_dining", "groceries", "utilities", "insurance", "healthcare", "debt_payments", "subscriptions", "entertainment", "shopping", "personal_care", "education", "travel", "gifts_donations", "investments", "savings", "income_salary", "income_freelance", "income_investment", "income_other", "transfer", "refund", "fee", "uncategorized"];
const TYPES = ["income", "expense", "transfer", "refund"];

export default function Transactions() {
  const [filters, setFilters] = useState({ search: "", category: "all", type: "all", account: "all" });
  const [editTx, setEditTx] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const qc = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => apiClient.entities.Transaction.list("-date", 1000),
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiClient.entities.Account.list(),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.entities.Category.list("sort_order", 500),
  });

  const categoryList = categories.length > 0 ? categories.map(c => c.name) : CATEGORIES;
  const categoryColors = categories.length > 0
    ? Object.fromEntries(categories.map(c => [c.name, c.color]))
    : CATEGORY_COLORS;

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

  const bulkDeleteMut = useMutation({
    mutationFn: (ids) => apiClient.entities.Transaction.bulkDelete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
    },
  });

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const match = (t.merchant_clean || "").toLowerCase().includes(s) || (t.merchant_raw || "").toLowerCase().includes(s) || (t.notes || "").toLowerCase().includes(s);
        if (!match) return false;
      }
      if (filters.category !== "all" && t.category !== filters.category) return false;
      if (filters.type !== "all" && t.type !== filters.type) return false;
      if (filters.account !== "all" && t.account_id !== filters.account) return false;
      return true;
    });
  }, [transactions, filters]);

  const totalIncome = filtered.filter(t => t.amount > 0 && t.type !== "transfer").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filtered.filter(t => t.amount < 0 && t.type !== "transfer").reduce((s, t) => s + Math.abs(t.amount), 0);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(t => t.id)));
    }
  };

  const handleBulkCategory = (category) => {
    const ids = Array.from(selectedIds);
    bulkUpdateMut.mutate({ ids, data: { category } });
  };

  const handleBulkType = (type) => {
    const ids = Array.from(selectedIds);
    bulkUpdateMut.mutate({ ids, data: { type } });
    // Also flip amount signs for the affected transactions
    const toFlip = filtered.filter(t => selectedIds.has(t.id)).filter(t => {
      if (type === 'expense' && t.amount > 0) return true;
      if (type === 'income' && t.amount < 0) return true;
      return false;
    });
    if (toFlip.length > 0) {
      // Update amounts individually since each has a different value
      for (const t of toFlip) {
        const newAmount = -t.amount;
        apiClient.entities.Transaction.update(t.id, { amount: newAmount });
      }
      // Refresh after a short delay to catch all updates
      setTimeout(() => qc.invalidateQueries({ queryKey: ["transactions"] }), 500);
    }
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    bulkDeleteMut.mutate(ids);
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={`${filtered.length} transactions · In: ${formatCurrency(totalIncome)} · Out: ${formatCurrency(totalExpenses)}`}
      />
      <TransactionFilters filters={filters} setFilters={setFilters} accounts={accounts} />

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-3 bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3 flex-wrap">
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
      ) : filtered.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No transactions found" description="Import your bank data from the Import page to get started." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 divide-y divide-slate-100">
          {/* Select All header */}
          <div className="flex items-center gap-3 py-2 px-3">
            <input
              type="checkbox"
              checked={selectedIds.size === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs text-slate-400 font-medium">Select All</span>
          </div>
          {filtered.map((t) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              selected={selectedIds.has(t.id)}
              onToggleSelect={toggleSelect}
              onEdit={setEditTx}
              onToggleReview={(tx) => updateMut.mutate({ id: tx.id, d: { is_reviewed: !tx.is_reviewed } })}
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
    </div>
  );
}
