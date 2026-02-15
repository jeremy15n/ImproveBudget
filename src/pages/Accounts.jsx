import React, { useState } from "react";
import { apiClient } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Wallet, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import RecycleBin from "../components/shared/RecycleBin";
import { formatCurrency } from "../components/shared/formatters";
import { Skeleton } from "@/components/ui/skeleton";

const ACCOUNT_TYPES = ["checking", "savings", "credit_card", "brokerage", "retirement_401k", "retirement_ira", "hsa", "loan", "mortgage", "other"];

const ACCOUNT_TYPE_COLORS = {
  checking: "#3b82f6",      // blue
  savings: "#10b981",       // green
  credit_card: "#ef4444",   // red
  brokerage: "#8b5cf6",     // purple
  retirement_401k: "#f59e0b", // amber
  retirement_ira: "#f97316", // orange
  hsa: "#06b6d4",          // cyan
  loan: "#dc2626",         // dark red
  mortgage: "#991b1b",     // darker red
  other: "#94a3b8",        // slate
};

const emptyAccount = { name: "", account_type: "checking", balance: 0, is_asset: true, is_active: true, account_number_last4: "", notes: "" };

export default function Accounts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyAccount);
  const qc = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiClient.entities.Account.list(),
  });

  const createMut = useMutation({
    mutationFn: (d) => apiClient.entities.Account.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["accounts"] }); closeDialog(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }) => apiClient.entities.Account.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["accounts"] }); closeDialog(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => apiClient.entities.Account.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyAccount); };
  const openCreate = () => { setForm(emptyAccount); setEditing(null); setDialogOpen(true); };
  const openEdit = (acc) => { setForm({ ...acc, is_asset: Boolean(acc.is_asset) }); setEditing(acc); setDialogOpen(true); };
  const handleSave = () => {
    if (editing) updateMut.mutate({ id: editing.id, d: form });
    else createMut.mutate(form);
  };

  const totalAssets = accounts.filter(a => Boolean(a.is_asset) && a.is_active !== false).reduce((s, a) => s + (a.balance || 0), 0);
  const totalLiabilities = accounts.filter(a => !Boolean(a.is_asset) && a.is_active !== false).reduce((s, a) => s + Math.abs(a.balance || 0), 0);

  return (
    <div>
      <PageHeader
        title="Accounts & Assets"
        subtitle={`${accounts.length} accounts · Net: ${formatCurrency(totalAssets - totalLiabilities)}`}
        actions={
          <div className="flex items-center gap-2">
            <RecycleBin
              entityName="Account"
              apiEntity={apiClient.entities.Account}
              queryKey={["accounts"]}
              renderRow={(acc) => (
                <div>
                  <p className="text-sm font-medium text-slate-700">{acc.name}</p>
                  <p className="text-xs text-slate-400">
                    {acc.account_type?.replace(/_/g, " ")} · {formatCurrency(acc.balance)}
                  </p>
                </div>
              )}
            />
            <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" />Add Account</Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid gap-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : accounts.length === 0 ? (
        <EmptyState icon={Wallet} title="No accounts yet" description="Add your financial accounts to start tracking your money." actionLabel="Add Account" onAction={openCreate} />
      ) : (
        <div className="grid gap-3">
          {accounts.map((acc) => (
            <div key={acc.id} className="bg-white rounded-2xl border border-slate-200/60 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: acc.color || ACCOUNT_TYPE_COLORS[acc.account_type] || "#94a3b8" }}>
                {(acc.name || "?")[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{acc.name}</p>
                <p className="text-xs text-slate-500">{acc.account_type?.replace(/_/g, " ")} {acc.account_number_last4 ? `· ••${acc.account_number_last4}` : ""}</p>
              </div>
              <p className={`text-lg font-bold shrink-0 ${!Boolean(acc.is_asset) ? "text-red-600" : "text-slate-900"}`}>
                {formatCurrency(acc.balance || 0)}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(acc)}><Pencil className="w-4 h-4 text-slate-400" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(acc.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Account" : "Add Account"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., AMEX Platinum" />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={form.account_type} onValueChange={(v) => setForm({ ...form, account_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Current Balance</Label>
                <Input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-2">
                <Label>Last 4 Digits</Label>
                <Input maxLength={4} value={form.account_number_last4 || ""} onChange={(e) => setForm({ ...form, account_number_last4: e.target.value })} placeholder="1234" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={Boolean(form.is_asset)} onCheckedChange={(v) => setForm({ ...form, is_asset: v })} />
              <Label className="text-sm">{form.is_asset ? "Asset (adds to net worth)" : "Liability (subtracts from net worth)"}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name} className="bg-indigo-600 hover:bg-indigo-700">{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}