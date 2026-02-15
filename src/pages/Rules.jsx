import React, { useState } from "react";
import { apiClient } from "@/api/apiClient";
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
import RecycleBin from "../components/shared/RecycleBin";
import { useCategories } from "../hooks/useCategories";
import { toast } from "sonner";

const MATCH_TYPES = ["contains", "starts_with", "exact"];

const emptyRule = { match_pattern: "", match_type: "contains", category: "uncategorized", merchant_clean_name: "", priority: 0 };

export default function Rules() {
  const { categoryList, categoryColors, getCategoryLabel } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyRule);
  const [running, setRunning] = useState(false);
  const qc = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ["rules"],
    queryFn: () => apiClient.entities.CategoryRule.list("-priority"),
  });

  const createMut = useMutation({
    mutationFn: (d) => apiClient.entities.CategoryRule.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rules"] }); closeDialog(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }) => apiClient.entities.CategoryRule.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rules"] }); closeDialog(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => apiClient.entities.CategoryRule.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rules"] }),
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyRule); };

  const runRules = async () => {
    setRunning(true);
    try {
      // Fetch ALL transactions (not just uncategorized) so rules can fix wrong categories too
      let allTransactions = [];
      let offset = 0;
      const batchSize = 500;
      while (true) {
        const batch = await apiClient.entities.Transaction.list("-date", batchSize);
        allTransactions = allTransactions.concat(batch);
        if (batch.length < batchSize) break;
        offset += batchSize;
        // Simple pagination guard - fetch up to 5000 max
        if (offset >= 5000) break;
      }

      // Sort rules by priority (highest first)
      const activeRules = rules
        .filter(r => r.is_active !== 0)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));

      let matched = 0;

      for (const tx of allTransactions) {
        const merchant = (tx.merchant_raw || tx.merchant_clean || tx.description || "").toLowerCase();
        for (const rule of activeRules) {
          const pattern = rule.match_pattern.toLowerCase();
          let isMatch = false;
          if (rule.match_type === "contains") isMatch = merchant.includes(pattern);
          else if (rule.match_type === "starts_with") isMatch = merchant.startsWith(pattern);
          else if (rule.match_type === "exact") isMatch = merchant === pattern;

          if (isMatch) {
            // Check if anything actually needs to change
            const needsCategoryUpdate = tx.category !== rule.category;
            const needsNameUpdate = rule.merchant_clean_name && tx.merchant_clean !== rule.merchant_clean_name;

            if (needsCategoryUpdate || needsNameUpdate) {
              const update = {};
              if (needsCategoryUpdate) update.category = rule.category;
              if (needsNameUpdate) update.merchant_clean = rule.merchant_clean_name;
              await apiClient.entities.Transaction.update(tx.id, update);
              matched++;
            }
            break;
          }
        }
      }

      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(`Updated ${matched} transaction${matched !== 1 ? "s" : ""} across ${allTransactions.length} total`);
    } catch (err) {
      toast.error(`Failed to run rules: ${err.message}`);
    }
    setRunning(false);
  };

  return (
    <div>
      <PageHeader
        title="Rules"
        subtitle={`${rules.length} rules · Auto-categorize your transactions`}
        icon={Settings}
        actions={
          <div className="flex gap-2">
            <RecycleBin
              entityName="Rule"
              apiEntity={apiClient.entities.CategoryRule}
              queryKey={["rules"]}
              renderRow={(rule) => (
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {rule.match_pattern}
                  </p>
                  <p className="text-xs text-slate-400">
                    {rule.match_type} → {getCategoryLabel(rule.category)}
                  </p>
                </div>
              )}
            />
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
            <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">"{r.match_pattern}"</span>
                  <Badge variant="outline" className="text-[10px]">{r.match_type}</Badge>
                  <span className="text-slate-300">→</span>
                  <Badge style={{ backgroundColor: `${categoryColors[r.category] || "#cbd5e1"}20`, color: categoryColors[r.category] || "#64748b" }} className="text-[10px]">{getCategoryLabel(r.category)}</Badge>
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
              <div className="grid gap-2"><Label>Category</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categoryList.map(c => <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>)}</SelectContent></Select></div>
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
