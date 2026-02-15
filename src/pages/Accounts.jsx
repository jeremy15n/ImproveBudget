import React, { useState, useRef } from "react";
import { apiClient } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Wallet, Pencil, Trash2, Upload, X,
  Landmark, CreditCard, PiggyBank, TrendingUp, Heart, Briefcase, Home, Car, GraduationCap, Shield, DollarSign, Building2, Banknote, CircleDollarSign
} from "lucide-react";
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
const ACCOUNT_TYPE_COLORS = { checking: "#3b82f6", savings: "#10b981", credit_card: "#ef4444", brokerage: "#8b5cf6", retirement_401k: "#f59e0b", retirement_ira: "#f97316", hsa: "#06b6d4", loan: "#dc2626", mortgage: "#991b1b", other: "#94a3b8" };

const ICON_OPTIONS = [
  { name: "Landmark", component: Landmark },
  { name: "CreditCard", component: CreditCard },
  { name: "PiggyBank", component: PiggyBank },
  { name: "TrendingUp", component: TrendingUp },
  { name: "Briefcase", component: Briefcase },
  { name: "Home", component: Home },
  { name: "Car", component: Car },
  { name: "GraduationCap", component: GraduationCap },
  { name: "Shield", component: Shield },
  { name: "DollarSign", component: DollarSign },
  { name: "Building2", component: Building2 },
  { name: "Banknote", component: Banknote },
  { name: "Heart", component: Heart },
  { name: "CircleDollarSign", component: CircleDollarSign },
  { name: "Wallet", component: Wallet },
];

const ICON_MAP = Object.fromEntries(ICON_OPTIONS.map(i => [i.name, i.component]));

function AccountIcon({ acc, size = "w-10 h-10", iconSize = "w-5 h-5", textSize = "text-sm" }) {
  const bgColor = acc.color || ACCOUNT_TYPE_COLORS[acc.account_type] || "#94a3b8";
  const icon = acc.icon || "";

  // Uploaded image (base64 data URL)
  if (icon.startsWith("data:")) {
    return (
      <img
        src={icon}
        alt={acc.name}
        className={`${size} rounded-xl object-cover shrink-0`}
      />
    );
  }

  // Lucide icon name
  const IconComponent = ICON_MAP[icon];
  if (IconComponent) {
    return (
      <div className={`${size} rounded-xl flex items-center justify-center text-white shrink-0`} style={{ backgroundColor: bgColor }}>
        <IconComponent className={iconSize} />
      </div>
    );
  }

  // Default: first letter
  return (
    <div className={`${size} rounded-xl flex items-center justify-center text-white ${textSize} font-bold shrink-0`} style={{ backgroundColor: bgColor }}>
      {(acc.name || "?")[0]}
    </div>
  );
}

const emptyAccount = { name: "", account_type: "checking", balance: 0, is_asset: true, is_active: true, account_number_last4: "", notes: "", icon: "" };

export default function Accounts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyAccount);
  const [addRows, setAddRows] = useState([]);
  const fileInputRef = useRef(null);
  const qc = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({ queryKey: ["accounts"], queryFn: () => apiClient.entities.Account.list() });

  const createMut = useMutation({
    mutationFn: (items) => apiClient.entities.Account.bulkCreate(items),
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

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyAccount); setAddRows([]); };
  const openCreate = () => { setEditing(null); setAddRows([{ ...emptyAccount }]); setDialogOpen(true); };
  const openEdit = (acc) => { setForm({ ...acc, is_asset: Boolean(acc.is_asset) }); setEditing(acc); setDialogOpen(true); };

  const handleAddRow = () => setAddRows([...addRows, { ...emptyAccount }]);
  const handleRemoveRow = (index) => { if (addRows.length > 1) setAddRows(addRows.filter((_, i) => i !== index)); };
  const handleUpdateRow = (index, field, value) => setAddRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));

  const handleSave = () => {
    if (editing) updateMut.mutate({ id: editing.id, d: form });
    else createMut.mutate(addRows);
  };

  const handleImageUpload = (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      alert("Image must be under 512KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (target === "form") {
        setForm({ ...form, icon: dataUrl });
      } else if (typeof target === "number") {
        handleUpdateRow(target, "icon", dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const totalAssets = accounts.filter(a => Boolean(a.is_asset) && a.is_active !== false).reduce((s, a) => s + (a.balance || 0), 0);
  const totalLiabilities = accounts.filter(a => !Boolean(a.is_asset) && a.is_active !== false).reduce((s, a) => s + Math.abs(a.balance || 0), 0);

  // Icon picker sub-component used in both edit and add forms
  const IconPicker = ({ value, onChange }) => (
    <div className="grid gap-2">
      <Label className="text-xs">Icon</Label>
      <div className="flex flex-wrap gap-1.5">
        {/* No icon option */}
        <button
          type="button"
          onClick={() => onChange("")}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center text-[10px] font-bold transition-colors ${
            !value || value === ""
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
              : "border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          Aa
        </button>
        {ICON_OPTIONS.map((opt) => {
          const Icon = opt.component;
          const isSelected = value === opt.name;
          return (
            <button
              key={opt.name}
              type="button"
              onClick={() => onChange(opt.name)}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
        {/* Upload image button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
            value?.startsWith("data:")
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
              : "border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
          title="Upload image"
        >
          <Upload className="w-4 h-4" />
        </button>
      </div>
      {value?.startsWith("data:") && (
        <div className="flex items-center gap-2 mt-1">
          <img src={value} alt="preview" className="w-8 h-8 rounded-lg object-cover" />
          <button type="button" onClick={() => onChange("")} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
            <X className="w-3 h-3" /> Remove
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader title="Accounts & Assets" subtitle={`${accounts.length} accounts · Net: ${formatCurrency(totalAssets - totalLiabilities)}`}
        icon={Wallet}
        actions={<div className="flex items-center gap-2"><RecycleBin entityName="Account" apiEntity={apiClient.entities.Account} queryKey={["accounts"]} renderRow={(acc) => (<div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">{acc.name}</p><p className="text-xs text-slate-400">{acc.account_type?.replace(/_/g, " ")} · {formatCurrency(acc.balance)}</p></div>)} /><Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500"><Plus className="w-4 h-4 mr-2" />Add Account</Button></div>} />

      {isLoading ? <div className="grid gap-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div> : accounts.length === 0 ? <EmptyState icon={Wallet} title="No accounts yet" description="Add your financial accounts to start tracking your money." actionLabel="Add Account" onAction={openCreate} /> : (
        <div className="grid gap-3">
          {accounts.map((acc) => (
            <div key={acc.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <AccountIcon acc={acc} />
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{acc.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{acc.account_type?.replace(/_/g, " ")} {acc.account_number_last4 ? `· ••${acc.account_number_last4}` : ""}</p></div>
              <p className={`text-lg font-bold shrink-0 ${!Boolean(acc.is_asset) ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100"}`}>{formatCurrency(acc.balance || 0)}</p>
              <div className="flex items-center gap-1 shrink-0"><Button variant="ghost" size="icon" onClick={() => openEdit(acc)}><Pencil className="w-4 h-4 text-slate-400" /></Button><Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(acc.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button></div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (editing) {
            handleImageUpload(e, "form");
          }
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader><DialogTitle>{editing ? "Edit Account" : "Add Accounts"}</DialogTitle></DialogHeader>
          <div className="py-4 overflow-y-auto pr-1">
            {editing ? (
              /* Single Edit Form */
              <div className="grid gap-4">
                <div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Type</Label><Select value={form.account_type} onValueChange={(v) => setForm({ ...form, account_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Balance</Label><Input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: parseFloat(e.target.value) || 0 })} /></div><div className="grid gap-2"><Label>Last 4</Label><Input maxLength={4} value={form.account_number_last4 || ""} onChange={(e) => setForm({ ...form, account_number_last4: e.target.value })} /></div></div>
                <IconPicker value={form.icon || ""} onChange={(v) => setForm({ ...form, icon: v })} />
                <div className="flex items-center gap-3"><Switch checked={Boolean(form.is_asset)} onCheckedChange={(v) => setForm({ ...form, is_asset: v })} /><Label className="text-sm">{form.is_asset ? "Asset" : "Liability"}</Label></div>
              </div>
            ) : (
              /* Multi Add Rows */
              <div className="space-y-4">
                {addRows.map((row, idx) => (
                  <div key={idx} className={`space-y-3 ${addRows.length > 1 ? "p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50" : ""}`}>
                    {addRows.length > 1 && <div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Account {idx + 1}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveRow(idx)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button></div>}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5"><Label className="text-xs">Name</Label><Input className="h-8 text-xs" value={row.name} onChange={(e) => handleUpdateRow(idx, "name", e.target.value)} /></div>
                      <div className="grid gap-1.5"><Label className="text-xs">Type</Label><Select value={row.account_type} onValueChange={(v) => handleUpdateRow(idx, "account_type", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="grid gap-1.5 col-span-1"><Label className="text-xs">Balance</Label><Input type="number" className="h-8 text-xs" value={row.balance} onChange={(e) => handleUpdateRow(idx, "balance", parseFloat(e.target.value) || 0)} /></div>
                      <div className="grid gap-1.5 col-span-1"><Label className="text-xs">Last 4</Label><Input maxLength={4} className="h-8 text-xs" value={row.account_number_last4 || ""} onChange={(e) => handleUpdateRow(idx, "account_number_last4", e.target.value)} /></div>
                      <div className="grid gap-1.5 col-span-1 items-end pb-1"><div className="flex items-center gap-2"><Switch checked={Boolean(row.is_asset)} onCheckedChange={(v) => handleUpdateRow(idx, "is_asset", v)} /><Label className="text-xs">{row.is_asset ? "Asset" : "Liab"}</Label></div></div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full border-dashed dark:border-slate-700" onClick={handleAddRow}><Plus className="w-3.5 h-3.5 mr-1.5" /> Add Another Account</Button>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500">{editing ? "Update" : `Save ${addRows.length > 1 ? addRows.length + " Accounts" : "Account"}`}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Export for reuse in other components (e.g. AccountsSummary)
export { AccountIcon, ACCOUNT_TYPE_COLORS, ICON_MAP };
