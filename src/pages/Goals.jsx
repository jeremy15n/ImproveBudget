import React, { useState } from "react";
import { apiClient } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import RecycleBin from "../components/shared/RecycleBin";
import { formatCurrency } from "../components/shared/formatters";
import moment from "moment";

const GOAL_CATEGORIES = ["emergency_fund", "retirement", "fi_number", "house", "car", "vacation", "debt_payoff", "education", "other"];
const GOAL_ICONS = { emergency_fund: "🛡️", retirement: "🏖️", fi_number: "🔥", house: "🏠", car: "🚗", vacation: "✈️", debt_payoff: "💳", education: "🎓", other: "🎯" };

const emptyGoal = { name: "", target_amount: 0, current_amount: 0, category: "emergency_fund", target_date: "", monthly_contribution: 0, notes: "" };

export default function Goals() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyGoal);
  const [addRows, setAddRows] = useState([]);
  const qc = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({ queryKey: ["goals"], queryFn: () => apiClient.entities.FinancialGoal.list() });

  const createMut = useMutation({
    mutationFn: (items) => apiClient.entities.FinancialGoal.bulkCreate(items),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); closeDialog(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }) => apiClient.entities.FinancialGoal.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); closeDialog(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => apiClient.entities.FinancialGoal.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyGoal); setAddRows([]); };
  const openAdd = () => { setEditing(null); setAddRows([emptyGoal]); setDialogOpen(true); };
  
  const handleAddRow = () => setAddRows([...addRows, emptyGoal]);
  const handleRemoveRow = (index) => { if(addRows.length > 1) setAddRows(addRows.filter((_, i) => i !== index)); };
  const handleUpdateRow = (index, field, value) => setAddRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));

  const handleSave = () => {
    if (editing) updateMut.mutate({ id: editing.id, d: form });
    else createMut.mutate(addRows);
  };

  return (
    <div>
      <PageHeader title="Financial Goals" subtitle="Track progress toward financial independence"
        actions={<div className="flex items-center gap-2"><RecycleBin entityName="Goal" apiEntity={apiClient.entities.FinancialGoal} queryKey={["goals"]} renderRow={(g) => (<div><p className="text-sm font-medium text-slate-700 dark:text-slate-200">{g.name}</p><p className="text-xs text-slate-400">Target: {formatCurrency(g.target_amount)}</p></div>)} /><Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500"><Plus className="w-4 h-4 mr-2" />Add Goal</Button></div>} />

      {goals.length === 0 && !isLoading ? <EmptyState icon={Target} title="No goals yet" description="Set financial goals." actionLabel="Create Goal" onAction={openAdd} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => {
            const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
            const remaining = g.target_amount - g.current_amount;
            const monthsLeft = g.monthly_contribution > 0 ? Math.ceil(remaining / g.monthly_contribution) : null;
            return (
              <div key={g.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4"><div className="flex items-center gap-3"><span className="text-2xl">{GOAL_ICONS[g.category] || "🎯"}</span><div><h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{g.name}</h3><p className="text-[11px] text-slate-400 capitalize">{g.category?.replace(/_/g, " ")}</p></div></div><div className="flex gap-0.5"><Button variant="ghost" size="icon" onClick={() => { setForm(g); setEditing(g); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5 text-slate-400" /></Button><Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(g.id)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button></div></div>
                <div className="flex items-end justify-between mb-2"><span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(g.current_amount)}</span><span className="text-xs text-slate-400">of {formatCurrency(g.target_amount)}</span></div>
                <Progress value={Math.min(pct, 100)} className="h-2.5 mb-3" />
                <div className="flex items-center justify-between text-[11px]"><span className="text-slate-500 dark:text-slate-400">{pct.toFixed(1)}% complete</span>{monthsLeft && <span className="text-indigo-600 dark:text-indigo-400 font-medium">~{monthsLeft} months left</span>}</div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>{editing ? "Edit Goal" : "Add Goals"}</DialogTitle></DialogHeader>
          <div className="py-4 overflow-y-auto pr-1">
            {editing ? (
                /* Single Edit */
                <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="grid gap-2"><Label>Category</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{GOAL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div></div>
                    <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Target</Label><Input type="number" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: parseFloat(e.target.value) || 0 })} /></div><div className="grid gap-2"><Label>Current</Label><Input type="number" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: parseFloat(e.target.value) || 0 })} /></div></div>
                    <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Contribution</Label><Input type="number" value={form.monthly_contribution} onChange={(e) => setForm({ ...form, monthly_contribution: parseFloat(e.target.value) || 0 })} /></div><div className="grid gap-2"><Label>Date</Label><Input type="date" value={form.target_date || ""} onChange={(e) => setForm({ ...form, target_date: e.target.value })} /></div></div>
                </div>
            ) : (
                /* Multi Add */
                <div className="space-y-4">
                    {addRows.map((row, idx) => (
                        <div key={idx} className={`space-y-3 ${addRows.length > 1 ? "p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50" : ""}`}>
                            {addRows.length > 1 && <div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Goal {idx + 1}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveRow(idx)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button></div>}
                            <div className="grid grid-cols-2 gap-3"><div className="grid gap-1.5"><Label className="text-xs">Name</Label><Input className="h-8 text-xs" value={row.name} onChange={(e) => handleUpdateRow(idx, "name", e.target.value)} /></div><div className="grid gap-1.5"><Label className="text-xs">Category</Label><Select value={row.category} onValueChange={(v) => handleUpdateRow(idx, "category", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{GOAL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div></div>
                            <div className="grid grid-cols-2 gap-3"><div className="grid gap-1.5"><Label className="text-xs">Target</Label><Input type="number" className="h-8 text-xs" value={row.target_amount} onChange={(e) => handleUpdateRow(idx, "target_amount", parseFloat(e.target.value) || 0)} /></div><div className="grid gap-1.5"><Label className="text-xs">Current</Label><Input type="number" className="h-8 text-xs" value={row.current_amount} onChange={(e) => handleUpdateRow(idx, "current_amount", parseFloat(e.target.value) || 0)} /></div></div>
                            <div className="grid grid-cols-2 gap-3"><div className="grid gap-1.5"><Label className="text-xs">Contrib</Label><Input type="number" className="h-8 text-xs" value={row.monthly_contribution} onChange={(e) => handleUpdateRow(idx, "monthly_contribution", parseFloat(e.target.value) || 0)} /></div><div className="grid gap-1.5"><Label className="text-xs">Date</Label><Input type="date" className="h-8 text-xs" value={row.target_date} onChange={(e) => handleUpdateRow(idx, "target_date", e.target.value)} /></div></div>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full border-dashed dark:border-slate-700" onClick={handleAddRow}><Plus className="w-3.5 h-3.5 mr-1.5" /> Add Another Goal</Button>
                </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500">{editing ? "Update" : `Save ${addRows.length > 1 ? addRows.length + " Goals" : "Goal"}`}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}