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

const emptyRule = () => ({ match_pattern: "", match_type: "contains", category: "uncategorized", merchant_clean_name: "", priority: 0 });

export default function Rules() {
  const { categoryList, categoryColors, getCategoryLabel } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyRule());
  const [addRows, setAddRows] = useState([]);
  const [running, setRunning] = useState(false);
  const qc = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ["rules"],
    queryFn: () => apiClient.entities.CategoryRule.list("-priority"),
  });

  const createMut = useMutation({
    mutationFn: (items) => apiClient.entities.CategoryRule.bulkCreate(items),
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

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyRule()); setAddRows([]); };
  const openCreate = () => { setEditing(null); setAddRows([emptyRule()]); setDialogOpen(true); };

  const handleAddRow = () => setAddRows([...addRows, emptyRule()]);
  const handleRemoveRow = (index) => { if (addRows.length > 1) setAddRows(addRows.filter((_, i) => i !== index)); };
  const handleUpdateRow = (index, field, value) => setAddRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));

  const handleSave = () => {
    if (editing) {
      updateMut.mutate({ id: editing.id, d: form });
    } else {
      createMut.mutate(addRows);
    }
  };

  const runRules = async () => {
    setRunning(true);
    try {
      let allTransactions = [];
      let offset = 0;
      const batchSize = 500;
      while (true) {
        const batch = await apiClient.entities.Transaction.list("-date", batchSize);
        allTransactions = allTransactions.concat(batch);
        if (batch.length < batchSize) break;
        offset += batchSize;
        if (offset >= 5000) break;
      }

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
            <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500"><Plus className="w-4 h-4 mr-2" />Add Rule</Button>
          </div>
        }
      />

      {rules.length === 0 ? (
        <EmptyState icon={Settings} title="No rules yet" description="Create rules to automatically categorize transactions based on merchant name patterns." actionLabel="Create Rule" onAction={openCreate} />
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
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader><DialogTitle>{editing ? "Edit Rule" : "Add Rules"}</DialogTitle></DialogHeader>
          <div className="py-4 overflow-y-auto pr-1">
            {editing ? (
              <div className="grid gap-4">
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
            ) : (
              <div className="space-y-4">
                {addRows.map((row, idx) => (
                  <div key={idx} className={`space-y-3 ${addRows.length > 1 ? "p-3 border border-slate-200 dark:border-slate-700 rounded-xl" : ""}`}>
                    {addRows.length > 1 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Rule {idx + 1}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveRow(idx)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 grid gap-1.5">
                        <Label className="text-xs">Match Pattern</Label>
                        <Input className="h-8 text-xs" value={row.match_pattern} onChange={(e) => handleUpdateRow(idx, "match_pattern", e.target.value)} placeholder="e.g., NETFLIX" />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Match Type</Label>
                        <Select value={row.match_type} onValueChange={(v) => handleUpdateRow(idx, "match_type", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{MATCH_TYPES.map(m => <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Category</Label>
                        <Select value={row.category} onValueChange={(v) => handleUpdateRow(idx, "category", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{categoryList.map(c => <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Clean Name</Label>
                        <Input className="h-8 text-xs" value={row.merchant_clean_name || ""} onChange={(e) => handleUpdateRow(idx, "merchant_clean_name", e.target.value)} placeholder="Optional" />
                      </div>
                    </div>
                    <div className="grid gap-1.5 w-24">
                      <Label className="text-xs">Priority</Label>
                      <Input type="number" className="h-8 text-xs" value={row.priority || 0} onChange={(e) => handleUpdateRow(idx, "priority", parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full border-dashed dark:border-slate-700" onClick={handleAddRow}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Another Rule
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={editing ? !form.match_pattern : !addRows.some(r => r.match_pattern.trim())} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500">
              {editing ? "Update" : `Save ${addRows.length > 1 ? addRows.length + " Rules" : "Rule"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}