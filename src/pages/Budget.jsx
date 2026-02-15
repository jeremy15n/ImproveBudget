import React, { useState, useMemo } from "react";
import { apiClient } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, PieChart, Pencil, Trash2, ChevronLeft, ChevronRight, Copy } from "lucide-react";
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
import { useCategories } from "../hooks/useCategories";
import moment from "moment";

export default function Budget() {
  const { categoryList, categoryColors, getCategoryLabel } = useCategories();
  const [selectedMonth, setSelectedMonth] = useState(moment().format("YYYY-MM"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  // State for single editing
  const [form, setForm] = useState({ category: "groceries", monthly_limit: 0, month: selectedMonth });
  // State for bulk creation
  const [addRows, setAddRows] = useState([]);

  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copySource, setCopySource] = useState("");
  const [copyTargetStart, setCopyTargetStart] = useState("");
  const [copyTargetEnd, setCopyTargetEnd] = useState("");
  const qc = useQueryClient();

  const prevMonth = moment(selectedMonth, "YYYY-MM").subtract(1, "month").format("YYYY-MM");
  const isCurrentMonth = selectedMonth === moment().format("YYYY-MM");
  const isFuture = moment(selectedMonth, "YYYY-MM").isAfter(moment(), "month");

  const monthStrip = useMemo(() => {
    const base = moment(selectedMonth, "YYYY-MM");
    const months = [];
    for (let i = -3; i <= 3; i++) {
      const m = base.clone().add(i, "month");
      months.push(m.format("YYYY-MM"));
    }
    return months;
  }, [selectedMonth]);

  const { data: budgets = [], isLoading: loadingBudgets } = useQuery({
    queryKey: ["budgets", selectedMonth],
    queryFn: () => apiClient.entities.Budget.filter({ month: selectedMonth }),
  });

  const { data: prevBudgets = [] } = useQuery({
    queryKey: ["budgets", prevMonth],
    queryFn: () => apiClient.entities.Budget.filter({ month: prevMonth }),
    enabled: !isFuture,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["budget-transactions", selectedMonth],
    queryFn: () => apiClient.entities.Transaction.filter({
      date_gte: `${selectedMonth}-01`,
      date_lte: `${selectedMonth}-31`,
    }, "-date", 2000),
    enabled: !isFuture,
  });

  const prevBudgetMap = useMemo(() => {
    const map = {};
    prevBudgets.forEach(b => { map[b.category] = b.monthly_limit || 0; });
    return map;
  }, [prevBudgets]);

  const updateMut = useMutation({
    mutationFn: ({ id, d }) => apiClient.entities.Budget.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["budgets"] }); closeDialog(); },
  });
  
  const deleteMut = useMutation({
    mutationFn: (id) => apiClient.entities.Budget.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });

  const bulkCreateMut = useMutation({
    mutationFn: (items) => apiClient.entities.Budget.bulkCreate(items),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["budgets"] }); closeDialog(); },
  });

  const copyBudgetMut = useMutation({
    mutationFn: async ({ source, targetStart, targetEnd }) => {
      const sourceBudgets = await apiClient.entities.Budget.filter({ month: source });
      if (sourceBudgets.length === 0) throw new Error("No budgets found in source month");
      const targets = [];
      const cursor = moment(targetStart, "YYYY-MM");
      const end = moment(targetEnd || targetStart, "YYYY-MM");
      while (cursor.isSameOrBefore(end, "month")) {
        const m = cursor.format("YYYY-MM");
        if (m !== source) targets.push(m);
        cursor.add(1, "month");
      }
      if (targets.length === 0) throw new Error("No valid target months");
      const items = targets.flatMap(month =>
        sourceBudgets.map(b => ({
          category: b.category,
          monthly_limit: b.monthly_limit,
          month,
          is_active: b.is_active ?? true,
          rollover: b.rollover ?? false,
          notes: b.notes || "",
        }))
      );
      return apiClient.entities.Budget.bulkCreate(items);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      setCopyDialogOpen(false);
    },
  });

  const openCopyDialog = () => {
    setCopySource(prevMonth);
    setCopyTargetStart(selectedMonth);
    setCopyTargetEnd(selectedMonth);
    setCopyDialogOpen(true);
  };

  const copyTargetCount = useMemo(() => {
    if (!copyTargetStart || !copyTargetEnd) return 0;
    const start = moment(copyTargetStart, "YYYY-MM");
    const end = moment(copyTargetEnd, "YYYY-MM");
    if (end.isBefore(start)) return 0;
    let count = 0;
    const cursor = start.clone();
    while (cursor.isSameOrBefore(end, "month")) {
      if (cursor.format("YYYY-MM") !== copySource) count++;
      cursor.add(1, "month");
    }
    return count;
  }, [copyTargetStart, copyTargetEnd, copySource]);

  const copyMonthOptions = useMemo(() => {
    const months = [];
    for (let i = -12; i <= 6; i++) {
      const m = moment().add(i, "month").format("YYYY-MM");
      months.push(m);
    }
    return months;
  }, []);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ category: "groceries", monthly_limit: 0, month: selectedMonth });
    setAddRows([]);
  };

  const openAddDialog = () => {
    setEditing(null);
    setAddRows([{ category: categoryList[0] || "groceries", monthly_limit: 0, month: selectedMonth }]);
    setDialogOpen(true);
  };

  const handleAddRow = () => {
    setAddRows([...addRows, { category: categoryList[0] || "groceries", monthly_limit: 0, month: selectedMonth }]);
  };

  const handleRemoveRow = (index) => {
    if (addRows.length === 1) return;
    setAddRows(addRows.filter((_, i) => i !== index));
  };

  const handleUpdateRow = (index, field, value) => {
    setAddRows(prev => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const handleSave = () => {
    if (editing) {
      updateMut.mutate({ id: editing.id, d: form });
    } else {
      bulkCreateMut.mutate(addRows);
    }
  };

  const monthExpenses = useMemo(() => {
    const map = {};
    transactions
      .filter((t) => t.amount < 0 && t.type !== "transfer")
      .forEach((t) => {
        const cat = t.category || "uncategorized";
        map[cat] = (map[cat] || 0) + Math.abs(t.amount);
      });
    return map;
  }, [transactions]);

  const totalBudget = budgets.reduce((s, b) => s + (b.monthly_limit || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + (monthExpenses[b.category] || 0), 0);

  const navigateMonth = (direction) => {
    setSelectedMonth(prev =>
      moment(prev, "YYYY-MM").add(direction, "month").format("YYYY-MM")
    );
  };

  const displayMonth = moment(selectedMonth, "YYYY-MM").format("MMMM YYYY");

  return (
    <div>
      <PageHeader
        title="Budget"
        subtitle={isFuture
          ? `${displayMonth} · Planned: ${formatCurrency(totalBudget)}`
          : `${displayMonth} · ${formatCurrency(totalSpent)} of ${formatCurrency(totalBudget)} spent`
        }
        actions={
          <div className="flex items-center gap-2">
            <RecycleBin
              entityName="Budget"
              apiEntity={apiClient.entities.Budget}
              queryKey={["budgets"]}
              renderRow={(b) => (
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {getCategoryLabel(b.category)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {b.month} · Limit: {formatCurrency(b.monthly_limit)}
                  </p>
                </div>
              )}
            />
            <Button variant="outline" size="sm" onClick={openCopyDialog} className="dark:border-slate-700 dark:text-slate-300">
              <Copy className="w-4 h-4 mr-1.5" />Copy Month
            </Button>
            <Button onClick={openAddDialog} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600" size="sm">
              <Plus className="w-4 h-4 mr-1.5" />Add Budget
            </Button>
          </div>
        }
      />

      {/* Month Navigation Strip */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 dark:border-slate-700 dark:text-slate-400" onClick={() => navigateMonth(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-1 overflow-x-auto px-1">
          {monthStrip.map((m) => {
            const isCurrent = m === moment().format("YYYY-MM");
            const isSelected = m === selectedMonth;
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  isSelected
                    ? "bg-indigo-600 text-white dark:bg-indigo-500"
                    : isCurrent
                    ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {moment(m, "YYYY-MM").format("MMM YYYY")}
              </button>
            );
          })}
        </div>
        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 dark:border-slate-700 dark:text-slate-400" onClick={() => navigateMonth(1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        {!isCurrentMonth && (
          <Button variant="ghost" size="sm" className="text-xs text-indigo-600 dark:text-indigo-400 shrink-0" onClick={() => setSelectedMonth(moment().format("YYYY-MM"))}>
            Today
          </Button>
        )}
      </div>

      {isFuture && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 text-center">
          <span className="text-xs text-amber-700 dark:text-amber-400">Planned budget — spending data will appear when transactions are imported for this month.</span>
        </div>
      )}

      {budgets.length === 0 && !loadingBudgets ? (
        <EmptyState icon={PieChart} title="No budgets for this month" description={`Create budget categories for ${displayMonth} to track spending.`} actionLabel="Create Budget" onAction={openAddDialog} />
      ) : (
        <div className="grid gap-3">
          {budgets.map((b) => {
            const spent = monthExpenses[b.category] || 0;
            const pct = b.monthly_limit > 0 ? (spent / b.monthly_limit) * 100 : 0;
            const isOver = pct > 100;
            const prevLimit = prevBudgetMap[b.category];
            const limitDiff = prevLimit !== undefined ? b.monthly_limit - prevLimit : null;
            return (
              <div key={b.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[b.category] || "#cbd5e1" }} />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">{getCategoryLabel(b.category)}</span>
                    {limitDiff !== null && limitDiff !== 0 && (
                      <span className={`text-[10px] ${limitDiff > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                        {limitDiff > 0 ? "+" : ""}{formatCurrency(limitDiff)} vs last month
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isFuture && (
                      <>
                        <span className={`text-sm font-bold ${isOver ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-200"}`}>{formatCurrency(spent)}</span>
                        <span className="text-xs text-slate-400">/ </span>
                      </>
                    )}
                    <span className="text-xs text-slate-400">{formatCurrency(b.monthly_limit)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setForm(b); setEditing(b); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5 text-slate-400" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(b.id)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                  </div>
                </div>
                {!isFuture && (
                  <>
                    <Progress value={Math.min(pct, 100)} className="h-2" style={{ "--progress-color": isOver ? "#ef4444" : categoryColors[b.category] || "#6366f1" }} />
                    <div className="flex justify-between mt-2">
                      <span className="text-[11px] text-slate-400">{pct.toFixed(0)}% used</span>
                      <span className={`text-[11px] font-medium ${isOver ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {isOver ? `${formatCurrency(spent - b.monthly_limit)} over` : `${formatCurrency(b.monthly_limit - spent)} remaining`}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Budget" : `Add Budget${addRows.length > 1 ? "s" : ""}`}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 overflow-y-auto pr-1">
            {editing ? (
              // Single Edit Mode
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categoryList.map((c) => <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Monthly Limit ($)</Label>
                  <Input type="number" value={form.monthly_limit} onChange={(e) => setForm({ ...form, monthly_limit: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="grid gap-2">
                  <Label>Month</Label>
                  <Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
                </div>
              </div>
            ) : (
              // Bulk Add Mode
              <div className="space-y-4">
                {addRows.map((row, idx) => (
                  <div key={idx} className={`space-y-3 ${addRows.length > 1 ? "p-3 border border-slate-200 dark:border-slate-800 rounded-xl relative bg-slate-50/50 dark:bg-slate-900/50" : ""}`}>
                    {addRows.length > 1 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Budget Item {idx + 1}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveRow(idx)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    )}
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Category</Label>
                          <Select value={row.category} onValueChange={(v) => handleUpdateRow(idx, "category", v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{categoryList.map((c) => <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Limit ($)</Label>
                          <Input 
                            type="number" 
                            className="h-8 text-xs" 
                            value={row.monthly_limit} 
                            onChange={(e) => handleUpdateRow(idx, "monthly_limit", parseFloat(e.target.value) || 0)} 
                          />
                        </div>
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Month</Label>
                        <Input 
                          type="month" 
                          className="h-8 text-xs" 
                          value={row.month} 
                          onChange={(e) => handleUpdateRow(idx, "month", e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full border-dashed dark:border-slate-700" onClick={handleAddRow}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Another Budget
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
              {editing ? "Update" : `Save ${addRows.length > 1 ? addRows.length + " Budgets" : "Budget"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Budget Dialog */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Copy Budget to Other Months</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Copy all budget items from a source month to one or more target months. Select a range to copy to multiple months at once.
            </p>
            <div className="grid gap-2">
              <Label>Copy From</Label>
              <Select value={copySource} onValueChange={setCopySource}>
                <SelectTrigger><SelectValue placeholder="Select source month" /></SelectTrigger>
                <SelectContent>
                  {copyMonthOptions.map((m) => (
                    <SelectItem key={m} value={m}>{moment(m, "YYYY-MM").format("MMMM YYYY")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Start Month</Label>
                <Select value={copyTargetStart} onValueChange={(v) => {
                  setCopyTargetStart(v);
                  if (!copyTargetEnd || moment(v, "YYYY-MM").isAfter(moment(copyTargetEnd, "YYYY-MM"))) {
                    setCopyTargetEnd(v);
                  }
                }}>
                  <SelectTrigger><SelectValue placeholder="From" /></SelectTrigger>
                  <SelectContent>
                    {copyMonthOptions.map((m) => (
                      <SelectItem key={m} value={m}>{moment(m, "YYYY-MM").format("MMM YYYY")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Through Month</Label>
                <Select value={copyTargetEnd} onValueChange={setCopyTargetEnd}>
                  <SelectTrigger><SelectValue placeholder="Through" /></SelectTrigger>
                  <SelectContent>
                    {copyMonthOptions
                      .filter((m) => !copyTargetStart || moment(m, "YYYY-MM").isSameOrAfter(moment(copyTargetStart, "YYYY-MM")))
                      .map((m) => (
                        <SelectItem key={m} value={m}>{moment(m, "YYYY-MM").format("MMM YYYY")}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {copyTargetCount > 0 && (
              <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg p-2.5 text-center">
                <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                  Will copy budget to {copyTargetCount} month{copyTargetCount !== 1 ? "s" : ""}
                  {copyTargetCount === 1
                    ? `: ${moment(copyTargetStart, "YYYY-MM").format("MMMM YYYY")}`
                    : `: ${moment(copyTargetStart, "YYYY-MM").format("MMM YYYY")} — ${moment(copyTargetEnd, "YYYY-MM").format("MMM YYYY")}`
                  }
                </span>
              </div>
            )}
            {copyTargetCount === 0 && copyTargetStart && (
              <p className="text-xs text-amber-600 dark:text-amber-400">No valid target months. The source month is excluded from the range.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => copyBudgetMut.mutate({ source: copySource, targetStart: copyTargetStart, targetEnd: copyTargetEnd })}
              disabled={!copySource || !copyTargetStart || !copyTargetEnd || copyTargetCount === 0 || copyBudgetMut.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {copyBudgetMut.isPending ? "Copying..." : `Copy to ${copyTargetCount} Month${copyTargetCount !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}