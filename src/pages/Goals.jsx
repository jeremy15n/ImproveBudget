import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
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
import { formatCurrency } from "../components/shared/formatters";
import moment from "moment";

const GOAL_CATEGORIES = ["emergency_fund", "retirement", "fi_number", "house", "car", "vacation", "debt_payoff", "education", "other"];
const GOAL_ICONS = { emergency_fund: "🛡️", retirement: "🏖️", fi_number: "🔥", house: "🏠", car: "🚗", vacation: "✈️", debt_payoff: "💳", education: "🎓", other: "🎯" };

const emptyGoal = { name: "", target_amount: 0, current_amount: 0, category: "emergency_fund", target_date: "", monthly_contribution: 0, notes: "" };

export default function Goals() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyGoal);
  const qc = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.FinancialGoal.list(),
  });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.FinancialGoal.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); closeDialog(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }) => base44.entities.FinancialGoal.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); closeDialog(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.FinancialGoal.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyGoal); };

  return (
    <div>
      <PageHeader
        title="Financial Goals"
        subtitle="Track progress toward financial independence"
        actions={<Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" />Add Goal</Button>}
      />

      {goals.length === 0 && !isLoading ? (
        <EmptyState icon={Target} title="No goals yet" description="Set financial goals like emergency fund, retirement, or FI number to track your progress." actionLabel="Create Goal" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => {
            const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
            const remaining = g.target_amount - g.current_amount;
            const monthsLeft = g.monthly_contribution > 0 ? Math.ceil(remaining / g.monthly_contribution) : null;
            return (
              <div key={g.id} className="bg-white rounded-2xl border border-slate-200/60 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{GOAL_ICONS[g.category] || "🎯"}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{g.name}</h3>
                      <p className="text-[11px] text-slate-400 capitalize">{g.category?.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setForm(g); setEditing(g); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5 text-slate-400" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(g.id)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                  </div>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-2xl font-bold text-slate-900">{formatCurrency(g.current_amount)}</span>
                  <span className="text-xs text-slate-400">of {formatCurrency(g.target_amount)}</span>
                </div>
                <Progress value={Math.min(pct, 100)} className="h-2.5 mb-3" />
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{pct.toFixed(1)}% complete</span>
                  {g.target_date && <span className="text-slate-400">Due {moment(g.target_date).format("MMM YYYY")}</span>}
                  {monthsLeft && <span className="text-indigo-600 font-medium">~{monthsLeft} months left</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Goal" : "Add Goal"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Emergency Fund" /></div>
              <div className="grid gap-2"><Label>Category</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{GOAL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Target Amount ($)</Label><Input type="number" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: parseFloat(e.target.value) || 0 })} /></div>
              <div className="grid gap-2"><Label>Current Amount ($)</Label><Input type="number" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Monthly Contribution ($)</Label><Input type="number" value={form.monthly_contribution} onChange={(e) => setForm({ ...form, monthly_contribution: parseFloat(e.target.value) || 0 })} /></div>
              <div className="grid gap-2"><Label>Target Date</Label><Input type="date" value={form.target_date || ""} onChange={(e) => setForm({ ...form, target_date: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => editing ? updateMut.mutate({ id: editing.id, d: form }) : createMut.mutate(form)} disabled={!form.name} className="bg-indigo-600 hover:bg-indigo-700">{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}