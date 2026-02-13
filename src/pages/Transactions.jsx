import React, { useState, useMemo } from "react";
import { apiClient } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import TransactionFilters from "../components/transactions/TransactionFilters";
import TransactionRow from "../components/transactions/TransactionRow";
import TransactionEditDialog from "../components/transactions/TransactionEditDialog";
import { formatCurrency } from "../components/shared/formatters";
import { Skeleton } from "@/components/ui/skeleton";

export default function Transactions() {
  const [filters, setFilters] = useState({ search: "", category: "all", type: "all", account: "all" });
  const [editTx, setEditTx] = useState(null);
  const qc = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => apiClient.entities.Transaction.list("-date", 1000),
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiClient.entities.Account.list(),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }) => apiClient.entities.Transaction.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
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

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle={`${filtered.length} transactions · In: ${formatCurrency(totalIncome)} · Out: ${formatCurrency(totalExpenses)}`}
      />
      <TransactionFilters filters={filters} setFilters={setFilters} accounts={accounts} />

      {isLoading ? (
        <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No transactions found" description="Import your bank data from the Import page to get started." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 divide-y divide-slate-100">
          {filtered.map((t) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              onEdit={setEditTx}
              onToggleReview={(tx) => updateMut.mutate({ id: tx.id, d: { is_reviewed: !tx.is_reviewed } })}
              onToggleFlag={(tx) => updateMut.mutate({ id: tx.id, d: { is_flagged: !tx.is_flagged } })}
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