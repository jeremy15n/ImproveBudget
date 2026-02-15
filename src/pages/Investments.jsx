import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, TrendingUp, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import PageHeader from "../components/shared/PageHeader";
import StatCard from "../components/shared/StatCard";
import EmptyState from "../components/shared/EmptyState";
import RecycleBin from "../components/shared/RecycleBin";
import { formatCurrency } from "../components/shared/formatters";

const ASSET_CLASSES = ["us_stock", "intl_stock", "bond", "real_estate", "cash", "crypto", "commodity", "other"];
const ASSET_COLORS = { us_stock: "#6366f1", intl_stock: "#8b5cf6", bond: "#06b6d4", real_estate: "#f59e0b", cash: "#10b981", crypto: "#f43f5e", commodity: "#f97316", other: "#94a3b8" };

const emptyInv = { symbol: "", name: "", asset_class: "us_stock", shares: 0, cost_basis: 0, current_value: 0, current_price: 0, account_id: "", account_name: "" };

export default function Investments() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  // State for single edit
  const [form, setForm] = useState(emptyInv);
  // State for bulk add
  const [addRows, setAddRows] = useState([]);
  
  const qc = useQueryClient();

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ["investments"],
    queryFn: () => apiClient.entities.Investment.list(),
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiClient.entities.Account.list(),
  });

  const calculateFields = (d) => ({
    ...d,
    gain_loss: d.current_value - d.cost_basis,
    gain_loss_pct: d.cost_basis > 0 ? ((d.current_value - d.cost_basis) / d.cost_basis) * 100 : 0
  });

  const createMut = useMutation({
    mutationFn: (items) => {
        const payload = items.map(calculateFields);
        return apiClient.entities.Investment.bulkCreate(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["investments"] }); closeDialog(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }) => apiClient.entities.Investment.update(id, calculateFields(d)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["investments"] }); closeDialog(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => apiClient.entities.Investment.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });

  const refreshMut = useMutation({
    mutationFn: () => apiClient.refreshInvestmentPrices(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyInv); setAddRows([]); };
  
  const openAddDialog = () => {
    setEditing(null);
    setAddRows([emptyInv]);
    setDialogOpen(true);
  };

  const handleAddRow = () => setAddRows([...addRows, emptyInv]);
  const handleRemoveRow = (index) => {
    if (addRows.length === 1) return;
    setAddRows(addRows.filter((_, i) => i !== index));
  };
  const handleUpdateRow = (index, field, value) => {
    setAddRows(prev => prev.map((r, i) => {
        if (i !== index) return r;
        const updated = { ...r, [field]: value };
        // Auto-calc value if price/shares change
        if ((field === 'shares' || field === 'current_price') && updated.shares && updated.current_price) {
            updated.current_value = updated.shares * updated.current_price;
        }
        return updated;
    }));
  };

  // Fetch quote for a specific row
  const handleSymbolBlurRow = async (index, symbol) => {
    if (!symbol) return;
    try {
      const quote = await apiClient.getInvestmentQuote(symbol);
      if (quote) {
        handleUpdateRow(index, "name", quote.name);
        handleUpdateRow(index, "current_price", quote.price);
        // Trigger calc
        setAddRows(prev => prev.map((r, i) => i === index ? { ...r, current_value: r.shares * quote.price } : r));
      }
    } catch (error) { console.error("Failed to fetch quote", error); }
  };

  const handleSave = () => {
    if (editing) updateMut.mutate({ id: editing.id, d: form });
    else createMut.mutate(addRows);
  };

  const totalValue = investments.reduce((s, i) => s + (i.current_value || 0), 0);
  const totalCost = investments.reduce((s, i) => s + (i.cost_basis || 0), 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const allocationData = ASSET_CLASSES.map(ac => ({
    name: ac.replace(/_/g, " "),
    value: investments.filter(i => i.asset_class === ac).reduce((s, i) => s + (i.current_value || 0), 0),
    key: ac
  })).filter(d => d.value > 0);

  return (
    <div>
      <PageHeader
        title="Investments"
        subtitle={`${investments.length} holdings`}
        icon={TrendingUp}
        actions={
          <div className="flex gap-2">
            <RecycleBin
              entityName="Investment"
              apiEntity={apiClient.entities.Investment}
              queryKey={["investments"]}
              renderRow={(inv) => (
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{inv.symbol} - {inv.name}</p>
                  <p className="text-xs text-slate-400">{inv.shares} shares · {formatCurrency(inv.current_value)}</p>
                </div>
              )}
            />
            <Button onClick={() => refreshMut.mutate()} variant="outline" disabled={refreshMut.isPending} className="dark:border-slate-700 dark:text-slate-300">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshMut.isPending ? 'animate-spin' : ''}`} />
              Refresh Prices
            </Button>
            <Button onClick={openAddDialog} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"><Plus className="w-4 h-4 mr-2" />Add Holding</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Value" value={formatCurrency(totalValue)} icon={TrendingUp} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
        <StatCard label="Total Gain/Loss" value={formatCurrency(totalGain)} trend={totalGainPct} trendLabel="all time" iconBg={totalGain >= 0 ? "bg-emerald-50" : "bg-red-50"} iconColor={totalGain >= 0 ? "text-emerald-600" : "text-red-500"} icon={TrendingUp} />
        <StatCard label="Cost Basis" value={formatCurrency(totalCost)} icon={TrendingUp} iconBg="bg-slate-50" iconColor="text-slate-500" />
      </div>

      {allocationData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Portfolio</h3>
          <div className="flex items-center gap-6 max-w-xl mx-auto">
            <div className="w-[160px] h-[160px] md:w-[200px] md:h-[200px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={allocationData} dataKey="value" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none">
                  {allocationData.map(d => <Cell key={d.key} fill={ASSET_COLORS[d.key] || "#94a3b8"} />)}
                </Pie><Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#000" }} /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2.5">
              {allocationData.map(d => (
                <div key={d.key} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ASSET_COLORS[d.key] }} />
                    <span className="text-slate-600 dark:text-slate-400 capitalize">{d.name}</span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrency(d.value)}</span>
                    <span className="text-slate-400 ml-1">({((d.value / totalValue) * 100).toFixed(0)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {investments.length === 0 && !isLoading ? (
        <EmptyState icon={TrendingUp} title="No investments tracked" description="Add your investment holdings from Fidelity, Schwab, and other accounts." actionLabel="Add Holding" onAction={openAddDialog} />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th className="text-left px-4 py-3">Holding</th><th className="text-left px-4 py-3">Class</th><th className="text-right px-4 py-3">Shares</th><th className="text-right px-4 py-3">Value</th><th className="text-right px-4 py-3">Gain/Loss</th><th className="px-4 py-3"></th>
              </tr></thead>
              <tbody>{investments.map(inv => (
                <tr key={inv.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3"><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{inv.symbol}</p><p className="text-[11px] text-slate-400">{inv.name}</p></td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-md capitalize" style={{ backgroundColor: `${ASSET_COLORS[inv.asset_class] || "#94a3b8"}15`, color: ASSET_COLORS[inv.asset_class] || "#64748b" }}>{inv.asset_class?.replace(/_/g, " ")}</span></td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">{inv.shares}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(inv.current_value)}</td>
                  <td className="px-4 py-3 text-right"><span className={`text-sm font-semibold ${(inv.gain_loss || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>{formatCurrency(inv.gain_loss || 0)}</span><span className="text-[11px] text-slate-400 ml-1">({(inv.gain_loss_pct || 0).toFixed(1)}%)</span></td>
                  <td className="px-4 py-3"><div className="flex gap-0.5"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setForm(inv); setEditing(inv); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5 text-slate-400" /></Button><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(inv.id)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>{editing ? "Edit Holding" : "Add Holdings"}</DialogTitle></DialogHeader>
          <div className="py-4 overflow-y-auto pr-1">
            {editing ? (
                // Single Edit Form
                <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label>Symbol</Label><Input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} /></div>
                        <div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                    </div>
                    {/* ... rest of edit form fields matching Add row ... */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label>Asset Class</Label><Select value={form.asset_class} onValueChange={(v) => setForm({ ...form, asset_class: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ASSET_CLASSES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
                        <div className="grid gap-2"><Label>Account</Label><Select value={form.account_id || ""} onValueChange={(v) => { const a = accounts.find(x => x.id === v); setForm({ ...form, account_id: v, account_name: a?.name || "" }); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{accounts.filter(a => ["brokerage","retirement_401k","retirement_ira"].includes(a.account_type)).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="grid gap-2"><Label>Shares</Label><Input type="number" step="0.001" value={form.shares} onChange={(e) => setForm({ ...form, shares: parseFloat(e.target.value) || 0 })} /></div>
                        <div className="grid gap-2"><Label>Price</Label><Input type="number" step="0.01" value={form.current_price} onChange={(e) => setForm({ ...form, current_price: parseFloat(e.target.value) || 0 })} /></div>
                        <div className="grid gap-2"><Label>Cost ($)</Label><Input type="number" step="0.01" value={form.cost_basis} onChange={(e) => setForm({ ...form, cost_basis: parseFloat(e.target.value) || 0 })} /></div>
                        <div className="grid gap-2"><Label>Value ($)</Label><Input type="number" step="0.01" value={form.current_value} onChange={(e) => setForm({ ...form, current_value: parseFloat(e.target.value) || 0 })} /></div>
                    </div>
                </div>
            ) : (
                // Multi Add Rows
                <div className="space-y-4">
                    {addRows.map((row, idx) => (
                        <div key={idx} className={`space-y-3 ${addRows.length > 1 ? "p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50" : ""}`}>
                            {addRows.length > 1 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-500">Holding {idx + 1}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveRow(idx)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5"><Label className="text-xs">Symbol</Label><Input className="h-8 text-xs" value={row.symbol} onBlur={(e) => handleSymbolBlurRow(idx, e.target.value)} onChange={(e) => handleUpdateRow(idx, "symbol", e.target.value.toUpperCase())} placeholder="AAPL" /></div>
                                <div className="grid gap-1.5"><Label className="text-xs">Name</Label><Input className="h-8 text-xs" value={row.name} onChange={(e) => handleUpdateRow(idx, "name", e.target.value)} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5"><Label className="text-xs">Class</Label><Select value={row.asset_class} onValueChange={(v) => handleUpdateRow(idx, "asset_class", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{ASSET_CLASSES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
                                <div className="grid gap-1.5"><Label className="text-xs">Account</Label><Select value={row.account_id || ""} onValueChange={(v) => { const a = accounts.find(x => x.id === v); handleUpdateRow(idx, "account_id", v); handleUpdateRow(idx, "account_name", a?.name || ""); }}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{accounts.filter(a => ["brokerage","retirement_401k","retirement_ira"].includes(a.account_type)).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                <div className="grid gap-1.5"><Label className="text-xs">Shares</Label><Input type="number" className="h-8 text-xs" value={row.shares} onChange={(e) => handleUpdateRow(idx, "shares", parseFloat(e.target.value) || 0)} /></div>
                                <div className="grid gap-1.5"><Label className="text-xs">Price</Label><Input type="number" className="h-8 text-xs" value={row.current_price} onChange={(e) => handleUpdateRow(idx, "current_price", parseFloat(e.target.value) || 0)} /></div>
                                <div className="grid gap-1.5"><Label className="text-xs">Cost</Label><Input type="number" className="h-8 text-xs" value={row.cost_basis} onChange={(e) => handleUpdateRow(idx, "cost_basis", parseFloat(e.target.value) || 0)} /></div>
                                <div className="grid gap-1.5"><Label className="text-xs">Value</Label><Input type="number" className="h-8 text-xs" value={row.current_value} onChange={(e) => handleUpdateRow(idx, "current_value", parseFloat(e.target.value) || 0)} /></div>
                            </div>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full border-dashed dark:border-slate-700" onClick={handleAddRow}><Plus className="w-3.5 h-3.5 mr-1.5" /> Add Another Holding</Button>
                </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">{editing ? "Update" : `Save ${addRows.length > 1 ? addRows.length + " Holdings" : "Holding"}`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}