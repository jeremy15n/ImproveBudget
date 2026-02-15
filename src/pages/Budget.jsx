import React, { useState, useMemo } from "react";
import { apiClient } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Copy, DollarSign, TrendingDown, PiggyBank, PieChart, PartyPopper, Target, Frown } from "lucide-react";
import confetti from "canvas-confetti";
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

const SECTION_CONFIG = {
  income: {
    label: "Income",
    icon: DollarSign,
    headerBg: "bg-emerald-50 dark:bg-emerald-500/10",
    headerBorder: "border-emerald-200 dark:border-emerald-500/20",
    headerText: "text-emerald-700 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    progressColor: "#10b981",
    actualLabel: "received",
    overLabel: "extra",
    underLabel: "remaining",
  },
  expense: {
    label: "Expenses",
    icon: TrendingDown,
    headerBg: "bg-rose-50 dark:bg-rose-500/10",
    headerBorder: "border-rose-200 dark:border-rose-500/20",
    headerText: "text-rose-700 dark:text-rose-400",
    iconBg: "bg-rose-100 dark:bg-rose-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
    progressColor: "#f43f5e",
    actualLabel: "spent",
    overLabel: "over",
    underLabel: "remaining",
  },
  savings: {
    label: "Savings",
    icon: PiggyBank,
    headerBg: "bg-indigo-50 dark:bg-indigo-500/10",
    headerBorder: "border-indigo-200 dark:border-indigo-500/20",
    headerText: "text-indigo-700 dark:text-indigo-400",
    iconBg: "bg-indigo-100 dark:bg-indigo-500/20",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    progressColor: "#6366f1",
    actualLabel: "saved",
    overLabel: "extra",
    underLabel: "remaining",
  },
};

export default function Budget() {
  const { categoryList, categoryColors, getCategoryLabel, getCategoryType, categoriesByType } = useCategories();
  const [selectedMonth, setSelectedMonth] = useState(moment().format("YYYY-MM"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [dialogType, setDialogType] = useState("expense");

  const [form, setForm] = useState({ category: "groceries", monthly_limit: 0, month: selectedMonth });
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
      months.push(base.clone().add(i, "month").format("YYYY-MM"));
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
      months.push(moment().add(i, "month").format("YYYY-MM"));
    }
    return months;
  }, []);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ category: "groceries", monthly_limit: 0, month: selectedMonth });
    setAddRows([]);
  };

  const openAddDialog = (type = "expense") => {
    setDialogType(type);
    setEditing(null);
    const defaultCat = categoriesByType[type]?.[0] || categoryList[0] || "groceries";
    setAddRows([{ category: defaultCat, monthly_limit: 0, month: selectedMonth }]);
    setDialogOpen(true);
  };

  const handleAddRow = () => {
    const defaultCat = categoriesByType[dialogType]?.[0] || categoryList[0] || "groceries";
    setAddRows([...addRows, { category: defaultCat, monthly_limit: 0, month: selectedMonth }]);
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

  // Transaction actuals by category
  const categoryActuals = useMemo(() => {
    const map = {};
    transactions
      .filter(t => t.type !== "transfer" && !t.is_transfer)
      .forEach(t => {
        const cat = t.category || "uncategorized";
        map[cat] = (map[cat] || 0) + Math.abs(t.amount);
      });
    return map;
  }, [transactions]);

  // Group budgets by type
  const budgetsByType = useMemo(() => {
    const grouped = { income: [], expense: [], savings: [] };
    budgets.forEach(b => {
      const type = getCategoryType(b.category);
      if (grouped[type]) grouped[type].push(b);
      else grouped.expense.push(b);
    });
    return grouped;
  }, [budgets, getCategoryType]);

  // Totals for each section
  const sectionTotals = useMemo(() => {
    const totals = {};
    for (const type of ["income", "expense", "savings"]) {
      const planned = budgetsByType[type].reduce((s, b) => s + (b.monthly_limit || 0), 0);
      const actual = budgetsByType[type].reduce((s, b) => s + (categoryActuals[b.category] || 0), 0);
      totals[type] = { planned, actual };
    }
    return totals;
  }, [budgetsByType, categoryActuals]);

  const toBeAllocated = sectionTotals.income.planned - sectionTotals.expense.planned - sectionTotals.savings.planned;

  const navigateMonth = (direction) => {
    setSelectedMonth(prev =>
      moment(prev, "YYYY-MM").add(direction, "month").format("YYYY-MM")
    );
  };

  // Happy Confetti (Keeps using canvas-confetti)
  const triggerConfetti = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  // UPDATED: Custom "Sad Rain" Effect (No Canvas Confetti for this)
  const triggerBooHoo = () => {
    const emojis = ['👎', '💸', '📉', '😭', '🤡'];
    const duration = 3000; // Rain for 3 seconds
    const end = Date.now() + duration;

    // Create a new interval to spawn elements
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      // Create a floating element
      const el = document.createElement('div');
      el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
      
      // Styling to make it look like a large falling object, not confetti
      el.style.position = 'fixed';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.top = '-50px';
      el.style.fontSize = Math.floor(Math.random() * 20 + 30) + 'px'; // Random size between 30px and 50px
      el.style.zIndex = '9999';
      el.style.pointerEvents = 'none'; // So you can click through them
      el.style.userSelect = 'none';
      document.body.appendChild(el);

      // Animate using Web Animations API for smooth falling
      const animation = el.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(110vh) rotate(${Math.random() * 20 - 10}deg)`, opacity: 0 } // Slight wobble, mostly straight down
      ], {
        duration: Math.random() * 1500 + 1500, // Fall duration between 1.5s and 3s
        easing: 'linear'
      });

      // Remove element when animation finishes
      animation.onfinish = () => {
        el.remove();
      };

    }, 100); // Spawn a new emoji every 100ms
  };

  const displayMonth = moment(selectedMonth, "YYYY-MM").format("MMMM YYYY");
  const totalBudgetItems = budgets.length;

  const dialogCategories = editing ? categoryList : (categoriesByType[dialogType] || categoryList);

  return (
    <div>
      <PageHeader
        title="Budget"
        subtitle={`${displayMonth} · ${totalBudgetItems} items`}
        icon={PieChart}
        actions={
          <div className="flex items-center gap-2">
             <Button
              onClick={triggerBooHoo}
              className="text-white bg-gradient-to-r from-red-700 to-rose-900"
            >
              <Frown className="w-4 h-4 mr-1.5" />
              Boo Hoo!
            </Button>
            <Button
              onClick={triggerConfetti}
              className="text-white bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600"
            >
              <PartyPopper className="w-4 h-4 mr-1.5" />
              Woo Hoo!
            </Button>
            <RecycleBin
              entityName="Budget"
              apiEntity={apiClient.entities.Budget}
              queryKey={["budgets"]}
              renderRow={(b) => (
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{getCategoryLabel(b.category)}</p>
                  <p className="text-xs text-slate-400">{b.month} · {formatCurrency(b.monthly_limit)}</p>
                </div>
              )}
            />
            <Button variant="outline" onClick={openCopyDialog} className="dark:border-slate-700 dark:text-slate-300">
              <Copy className="w-4 h-4 mr-1.5" />Copy Month
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

      {/* Zero-Based Summary Header */}
      {totalBudgetItems > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Month Overview</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Income</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(sectionTotals.income.planned)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10">
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">Expenses</p>
              <p className="text-lg font-bold text-rose-700 dark:text-rose-300">{formatCurrency(sectionTotals.expense.planned)}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Savings</p>
              <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{formatCurrency(sectionTotals.savings.planned)}</p>
            </div>
            <div className={`text-center p-2 rounded-lg ${
              toBeAllocated === 0
                ? "bg-emerald-50 dark:bg-emerald-500/10"
                : toBeAllocated > 0
                ? "bg-amber-50 dark:bg-amber-500/10"
                : "bg-red-50 dark:bg-red-500/10"
            }`}>
              <p className={`text-[11px] font-medium ${
                toBeAllocated === 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : toBeAllocated > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400"
              }`}>To Allocate</p>
              <p className={`text-lg font-bold ${
                toBeAllocated === 0
                  ? "text-emerald-700 dark:text-emerald-300"
                  : toBeAllocated > 0
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-red-700 dark:text-red-300"
              }`}>{formatCurrency(toBeAllocated)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Three-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {["income", "expense", "savings"].map((type) => {
          const config = SECTION_CONFIG[type];
          const items = budgetsByType[type];
          const totals = sectionTotals[type];
          const Icon = config.icon;

          return (
            <div key={type} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden">
              {/* Section Header */}
              <div className={`p-4 ${config.headerBg} border-b ${config.headerBorder}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${config.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-semibold ${config.headerText}`}>{config.label}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isFuture
                          ? `Planned: ${formatCurrency(totals.planned)}`
                          : `${formatCurrency(totals.actual)} of ${formatCurrency(totals.planned)} ${config.actualLabel}`
                        }
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-xs ${config.headerText}`}
                    onClick={() => openAddDialog(type)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />Add
                  </Button>
                </div>
              </div>

              {/* Budget Items */}
              <div className="p-3 space-y-2">
                {items.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-slate-400">No {config.label.toLowerCase()} planned</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`mt-2 text-xs ${config.headerText}`}
                      onClick={() => openAddDialog(type)}
                    >
                      <Plus className="w-3 h-3 mr-1" />Add {config.label}
                    </Button>
                  </div>
                ) : (
                  items.map((b) => {
                    const actual = categoryActuals[b.category] || 0;
                    const pct = b.monthly_limit > 0 ? (actual / b.monthly_limit) * 100 : 0;
                    const isOver = pct > 100;
                    const prevLimit = prevBudgetMap[b.category];
                    const limitDiff = prevLimit !== undefined ? b.monthly_limit - prevLimit : null;

                    return (
                      <div key={b.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: categoryColors[b.category] || "#cbd5e1" }} />
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{getCategoryLabel(b.category)}</span>
                            {limitDiff !== null && limitDiff !== 0 && (
                              <span className={`text-[10px] shrink-0 ${limitDiff > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                                {limitDiff > 0 ? "+" : ""}{formatCurrency(limitDiff)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setForm(b); setEditing(b); setDialogType(type); setDialogOpen(true); }}>
                              <Pencil className="w-3 h-3 text-slate-400" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMut.mutate(b.id)}>
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-baseline justify-between mb-1.5">
                          {!isFuture ? (
                            <>
                              <span className={`text-sm font-bold ${isOver && type === "expense" ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100"}`}>
                                {formatCurrency(actual)}
                              </span>
                              <span className="text-[11px] text-slate-400">/ {formatCurrency(b.monthly_limit)}</span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(b.monthly_limit)}</span>
                          )}
                        </div>

                        {!isFuture && (
                          <>
                            <Progress
                              value={Math.min(pct, 100)}
                              className="h-1.5"
                              style={{ "--progress-color": isOver && type === "expense" ? "#ef4444" : config.progressColor }}
                            />
                            <div className="flex justify-between mt-1">
                              <span className="text-[10px] text-slate-400">{pct.toFixed(0)}% {config.actualLabel}</span>
                              <span className={`text-[10px] font-medium ${
                                isOver && type === "expense"
                                  ? "text-red-500 dark:text-red-400"
                                  : isOver
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}>
                                {isOver
                                  ? `${formatCurrency(actual - b.monthly_limit)} ${config.overLabel}`
                                  : `${formatCurrency(b.monthly_limit - actual)} ${config.underLabel}`
                                }
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? "Edit Budget Item"
                : `Add ${SECTION_CONFIG[dialogType]?.label || "Budget"}`
              }
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 overflow-y-auto pr-1">
            {editing ? (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categoryList.map((c) => <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Planned Amount ($)</Label>
                  <Input type="number" value={form.monthly_limit} onChange={(e) => setForm({ ...form, monthly_limit: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="grid gap-2">
                  <Label>Month</Label>
                  <Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {addRows.map((row, idx) => (
                  <div key={idx} className={`space-y-3 ${addRows.length > 1 ? "p-3 border border-slate-200 dark:border-slate-800 rounded-xl relative bg-slate-50/50 dark:bg-slate-900/50" : ""}`}>
                    {addRows.length > 1 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Item {idx + 1}</span>
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
                            <SelectContent>{dialogCategories.map((c) => <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Amount ($)</Label>
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
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Another
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
              {editing ? "Update" : `Save ${addRows.length > 1 ? addRows.length + " Items" : "Item"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Budget Dialog */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader><DialogTitle>Copy Budget to Other Months</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Copy all budget items (income, expenses, and savings) from a source month to one or more target months.
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