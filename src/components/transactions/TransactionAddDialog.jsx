import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useCategories } from "../../hooks/useCategories";
import moment from "moment";

const TYPES = ["income", "expense", "savings", "transfer", "refund"];

const emptyRow = () => ({
  merchant_clean: "",
  date: moment().format("YYYY-MM-DD"),
  amount: 0,
  type: "expense",
  category: "uncategorized",
  account_id: "",
  account_name: "",
  notes: "",
});

export default function TransactionAddDialog({ open, onClose, onSave, accounts }) {
  const { categoryList, getCategoryLabel } = useCategories();
  const [rows, setRows] = useState([emptyRow()]);

  const updateRow = (index, updates) => {
    setRows(prev => prev.map((r, i) => (i === index ? { ...r, ...updates } : r)));
  };

  const addRow = () => setRows(prev => [...prev, emptyRow()]);

  const removeRow = (index) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleTypeChange = (index, type) => {
    const row = rows[index];
    let newAmount = row.amount || 0;
    if ((type === "expense" || type === "savings") && newAmount > 0) newAmount = -Math.abs(newAmount);
    if (type === "income" && newAmount < 0) newAmount = Math.abs(newAmount);
    updateRow(index, { type, amount: newAmount });
  };

  const handleSave = () => {
    const valid = rows.filter(r => r.merchant_clean.trim() && r.date);
    if (valid.length === 0) return;
    onSave(valid);
    setRows([emptyRow()]);
    onClose();
  };

  const handleClose = () => {
    setRows([emptyRow()]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Transaction{rows.length > 1 ? "s" : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {rows.map((row, idx) => (
            <div key={idx} className={`space-y-3 ${rows.length > 1 ? "p-3 border border-slate-200 rounded-xl relative" : ""}`}>
              {rows.length > 1 && (
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-500">Transaction {idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRow(idx)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Merchant</Label>
                  <Input
                    placeholder="e.g. Grocery Store"
                    value={row.merchant_clean}
                    onChange={(e) => updateRow(idx, { merchant_clean: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={row.date}
                    onChange={(e) => updateRow(idx, { date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={row.amount || ""}
                    placeholder="0.00"
                    onChange={(e) => updateRow(idx, { amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select value={row.type} onValueChange={(v) => handleTypeChange(idx, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select value={row.category} onValueChange={(v) => updateRow(idx, { category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categoryList.map((c) => (
                        <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Account</Label>
                  <Select value={row.account_id || ""} onValueChange={(v) => {
                    const acc = accounts.find(a => a.id === v);
                    updateRow(idx, { account_id: v, account_name: acc?.name || "" });
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={row.notes}
                  onChange={(e) => updateRow(idx, { notes: e.target.value })}
                  rows={1}
                  placeholder="Optional"
                />
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" className="w-full border-dashed" onClick={addRow}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Another Transaction
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
            Save {rows.length > 1 ? `${rows.length} Transactions` : "Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
