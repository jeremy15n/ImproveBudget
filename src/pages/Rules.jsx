import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Settings, Pencil, Trash2, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import { getCategoryLabel, CATEGORY_COLORS } from "../components/shared/formatters";
import { toast } from "sonner";

const CATEGORIES = ["housing", "transportation", "food_dining", "groceries", "utilities", "insurance", "healthcare", "debt_payments", "subscriptions", "entertainment", "shopping", "personal_care", "education", "travel", "gifts_donations", "investments", "savings", "income_salary", "income_freelance", "income_investment", "income_other", "transfer", "refund", "fee", "uncategorized"];
const MATCH_TYPES = ["contains", "starts_with", "exact"];

const emptyRule = { match_pattern: "", match_type: "contains", category: "uncategorized", merchant_clean_name: "", priority: 0 };

export default function Rules() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyRule);
  const [running, setRunning] = useState(false);
  const qc = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ["rules"],
    queryFn: () => base44.entities.CategoryRule.list("-priority"),
  });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.CategoryRule.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rules"] }); closeDialog(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }) => base44.entities.CategoryRule.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rules"] }); closeDialog(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.CategoryRule.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rules"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyRule); };

  const runRules = async () => {
    setRunning(true);
    const transactions = await base44.entities.Transaction.filter({ category: "uncategorized" }, "-date", 500);
    let matched = 0;

    for (const tx of transactions) {
      const merchant = (tx.merchant_raw || tx.merchant_clean || "").toLowerCase();
      for (const rule of rules) {
        if (!rule.is_active && rule.is_active !== undefined) continue;
        const pattern = rule.match_pattern.toLowerCase();
        let isMatch = false;
        if (rule.match_type === "contains") isMatch = merchant.includes(pattern);
        else if (rule.match_type === "starts_with") isMatch = merchant.startsWith(pattern);
        else if (rule.match_type === "exact") isMatch = merchant === pattern;

        if (isMatch) {
          const update = { category: rule.category };
          if (rule.merchant_clean_name) update.merchant_clean = rule.merchant_clean_name;
          await base44.entities.Transaction.update(tx.id, update);
          matched++;
          break;
        }
      }
    }

    setRunning(false);
    qc.invalidateQueries({ queryKey: ["transactions"] });
    toast.success(`Applied rules to ${matched} of ${transactions.length} uncategorized transactions`);
  };

  return (
    <div>
      <PageHeader
        title="Categorization Rules"
        subtitle={`${rules.length} rules · Auto-categorize your transactions`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={runRules} disabled={running || rules.length === 0}>
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Run Rules
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" />Add Rule</Button>
          </div>
        }
      />

      {rules.length === 0 ? (
        <EmptyState icon={Settings} title="No rules yet" description="Create rules to automatically categorize transactions based on merchant name patterns." actionLabel="Create Rule" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200/60 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-800">"{r.match_pattern}"</span>
                  <Badge variant="outline" className="text-[10px]">{r.match_type}</Badge>
                  <span className="text-slate-300">→</span>
                  <Badge style={{ backgroundColor: `${CATEGORY_COLORS[r.category] || "#cbd5e1"}20`, color: CATEGORY_COLORS[r.category] || "#64748b" }} className="text-[10px]">{getCategoryLabel(r.category)}</Badge>
                  {r.merchant_clean_name && <span className="text-xs text-slate-400">as "{r.merchant_clean_name}"</span>}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">Priority: {r.priority || 0}</span>
              <div className="flex gap-0.5 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setForm(r); setEditing(r); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5 text-slate-400" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(r.id)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Rule" : "Add Rule"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 grid gap-2"><Label>Match Pattern</Label><Input value={form.match_pattern} onChange={(e) => setForm({ ...form, match_pattern: e.target.value })} placeholder="e.g., NETFLIX, AMAZON" /></div>
              <div className="grid gap-2"><Label>Match Type</Label><Select value={form.match_type} onValueChange={(v) => setForm({ ...form, match_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MATCH_TYPES.map(m => <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Category</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><Label>Clean Name (optional)</Label><Input value={form.merchant_clean_name || ""} onChange={(e) => setForm({ ...form, merchant_clean_name: e.target.value })} placeholder="e.g., Netflix" /></div>
            </div>
            <div className="grid gap-2 w-32"><Label>Priority</Label><Input type="number" value={form.priority || 0} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => editing ? updateMut.mutate({ id: editing.id, d: form }) : createMut.mutate(form)} disabled={!form.match_pattern} className="bg-indigo-600 hover:bg-indigo-700">{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}