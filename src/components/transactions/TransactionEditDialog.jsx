import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getCategoryLabel } from "../shared/formatters";

const CATEGORIES = ["housing", "transportation", "food_dining", "groceries", "utilities", "insurance", "healthcare", "debt_payments", "subscriptions", "entertainment", "shopping", "personal_care", "education", "travel", "gifts_donations", "investments", "savings", "income_salary", "income_freelance", "income_investment", "income_other", "transfer", "refund", "fee", "uncategorized"];
const TYPES = ["income", "expense", "transfer", "refund"];

export default function TransactionEditDialog({ transaction, open, onClose, onSave, accounts }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (transaction) setForm({ ...transaction });
  }, [transaction]);

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Merchant</Label>
              <Input value={form.merchant_clean || ""} onChange={(e) => setForm({ ...form, merchant_clean: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Amount</Label>
              <Input type="number" step="0.01" value={form.amount || 0} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={form.type || "expense"} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={form.category || "uncategorized"} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Account</Label>
              <Select value={form.account_id || ""} onValueChange={(v) => {
                const acc = accounts.find(a => a.id === v);
                setForm({ ...form, account_id: v, account_name: acc?.name || "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_recurring || false} onCheckedChange={(v) => setForm({ ...form, is_recurring: v })} />
              <Label className="text-sm">Recurring</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_transfer || false} onCheckedChange={(v) => setForm({ ...form, is_transfer: v, type: v ? "transfer" : form.type })} />
              <Label className="text-sm">Transfer</Label>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Notes</Label>
            <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}