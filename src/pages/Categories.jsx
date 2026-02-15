import React, { useState } from "react";
import { apiClient } from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PageHeader from "../components/shared/PageHeader";
import RecycleBin from "../components/shared/RecycleBin";

const emptyCategory = { name: "", label: "", color: "#6366f1" };

export default function Categories() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyCategory);
  const [addRows, setAddRows] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const qc = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.entities.Category.list("sort_order", 500),
  });

  const createMut = useMutation({
    mutationFn: (items) => apiClient.entities.Category.bulkCreate(items),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); closeDialog(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }) => apiClient.entities.Category.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); closeDialog(); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => apiClient.entities.Category.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); setDeleteConfirm(null); },
  });

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyCategory); setAddRows([]); };
  const openCreate = () => { setEditing(null); setAddRows([{ ...emptyCategory }]); setDialogOpen(true); };
  const openEdit = (cat) => { setForm({ name: cat.name, label: cat.label, color: cat.color }); setEditing(cat); setDialogOpen(true); };

  const handleAddRow = () => setAddRows([...addRows, { ...emptyCategory }]);
  const handleRemoveRow = (index) => { if (addRows.length > 1) setAddRows(addRows.filter((_, i) => i !== index)); };
  const handleUpdateRow = (index, field, value) => setAddRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));

  const handleSave = () => {
    if (editing) {
      const data = {
        ...form,
        name: form.name || form.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
        is_default: 0,
        sort_order: editing.sort_order,
      };
      updateMut.mutate({ id: editing.id, d: data });
    } else {
      const items = addRows.map((row, idx) => ({
        ...row,
        name: row.name || row.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
        is_default: 0,
        sort_order: categories.length + idx,
      }));
      createMut.mutate(items);
    }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Manage your spending categories"
        icon={Palette}
        actions={
          <div className="flex items-center gap-2">
            <RecycleBin
              entityName="Category"
              apiEntity={apiClient.entities.Category}
              queryKey={["categories"]}
              renderRow={(cat) => (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <p className="text-sm font-medium text-slate-700">{cat.name}</p>
                </div>
              )}
            />
            <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500">
              <Plus className="w-4 h-4 mr-2" />Add Category
            </Button>
          </div>
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
        <div className="px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Categories</h3>
          <p className="text-xs text-slate-400 mt-0.5">Customize your spending categories and their colors</p>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading categories...</div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <div className="w-5 h-5 rounded-md border border-slate-200 shrink-0" style={{ backgroundColor: cat.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{cat.label}</p>
                <p className="text-[11px] text-slate-400">{cat.name}</p>
              </div>
              {cat.is_default ? (
                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full shrink-0">Default</span>
              ) : null}
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
                  <Pencil className="w-3.5 h-3.5 text-slate-400" />
                </Button>
                {!cat.is_default && (
                  deleteConfirm === cat.id ? (
                    <div className="flex items-center gap-1">
                      <Button size="sm" className="h-6 text-[10px] bg-red-600 hover:bg-red-700 px-2" onClick={() => deleteMut.mutate(cat.id)}>Delete</Button>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteConfirm(cat.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Add Categories"}</DialogTitle>
          </DialogHeader>
          <div className="py-4 overflow-y-auto pr-1">
            {editing ? (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Label</Label>
                  <Input placeholder="e.g. Pet Care" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Name (ID)</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-slate-500" />
                  <p className="text-[11px] text-slate-400">Used internally for matching.</p>
                </div>
                <div className="grid gap-2">
                  <Label>Color</Label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                    <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="#6366f1" className="flex-1" />
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: form.color }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {addRows.map((row, idx) => (
                  <div key={idx} className={`space-y-3 ${addRows.length > 1 ? "p-3 border border-slate-200 dark:border-slate-700 rounded-xl" : ""}`}>
                    {addRows.length > 1 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Category {idx + 1}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveRow(idx)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Label</Label>
                        <Input className="h-8 text-xs" placeholder="e.g. Pet Care" value={row.label} onChange={(e) => handleUpdateRow(idx, "label", e.target.value)} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Color</Label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={row.color} onChange={(e) => handleUpdateRow(idx, "color", e.target.value)} className="w-8 h-8 rounded-md border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 shrink-0" />
                          <Input className="h-8 text-xs flex-1" value={row.color} onChange={(e) => handleUpdateRow(idx, "color", e.target.value)} placeholder="#6366f1" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full border-dashed dark:border-slate-700" onClick={handleAddRow}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Another Category
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={editing ? !form.label.trim() : !addRows.some(r => r.label.trim())} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500">
              {editing ? "Update" : `Save ${addRows.length > 1 ? addRows.length + " Categories" : "Category"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}