import React, { useState } from 'react';
import { Trash2, RotateCcw, Trash, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';

/**
 * Reusable Recycle Bin Component with Search
 */
export default function RecycleBin({ entityName, apiEntity, renderRow, queryKey }) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const qc = useQueryClient();

  const { data: deletedItems = [], isLoading } = useQuery({
    queryKey: [...queryKey, 'deleted'],
    queryFn: () => apiEntity.listDeleted('-deleted_at', 500),
    enabled: open,
  });

  const restoreMut = useMutation({
    mutationFn: (id) => apiEntity.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
    },
  });

  const bulkRestoreMut = useMutation({
    mutationFn: (ids) => apiEntity.bulkRestore(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setSelectedIds(new Set());
    },
  });

  const hardDeleteMut = useMutation({
    mutationFn: (id) => apiEntity.hardDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
    },
  });

  const bulkHardDeleteMut = useMutation({
    mutationFn: (ids) => apiEntity.bulkHardDelete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setSelectedIds(new Set());
    },
  });

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkRestore = () => {
    const ids = Array.from(selectedIds);
    bulkRestoreMut.mutate(ids);
  };

  const handleBulkHardDelete = () => {
    if (!confirm(`Permanently delete ${selectedIds.size} items? This cannot be undone!`)) return;
    const ids = Array.from(selectedIds);
    bulkHardDeleteMut.mutate(ids);
  };

  // Filter items based on search query
  const filteredItems = deletedItems.filter(item => {
    if (!searchQuery) return true;
    const lowerQ = searchQuery.toLowerCase();
    
    // Generic search: check common fields
    return (
      item.name?.toLowerCase().includes(lowerQ) ||
      item.label?.toLowerCase().includes(lowerQ) ||
      item.merchant_clean?.toLowerCase().includes(lowerQ) ||
      item.merchant_raw?.toLowerCase().includes(lowerQ) ||
      item.category?.toLowerCase().includes(lowerQ) ||
      item.amount?.toString().includes(lowerQ) ||
      item.notes?.toLowerCase().includes(lowerQ)
    );
  });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-slate-300"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Recycle Bin
        {deletedItems.length > 0 && (
          <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
            {deletedItems.length}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-slate-600" />
                Recycle Bin - {entityName}s
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder={`Search deleted ${entityName.toLowerCase()}s...`}
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
            ) : deletedItems.length === 0 ? (
              <div className="py-8 text-center">
                <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Recycle bin is empty</p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto flex flex-col min-h-0">
                {/* Bulk Actions */}
                {selectedIds.size > 0 && (
                  <div className="mb-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex items-center gap-3 sticky top-0 z-10">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 ml-2">
                      {selectedIds.size} selected
                    </span>
                    <Button
                      size="sm"
                      onClick={handleBulkRestore}
                      className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Restore
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkHardDelete}
                      className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash className="w-3 h-3 mr-1" />
                      Delete Permanently
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedIds(new Set())}
                      className="h-7 text-xs ml-auto"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                )}

                {/* Deleted Items List */}
                {filteredItems.length === 0 ? (
                   <div className="py-8 text-center text-sm text-slate-400">No items match your search</div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    {filteredItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          {renderRow(item)}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => restoreMut.mutate(item.id)}
                            title="Restore"
                          >
                            <RotateCcw className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              if (confirm('Permanently delete? This cannot be undone!')) {
                                hardDeleteMut.mutate(item.id);
                              }
                            }}
                            title="Delete Permanently"
                          >
                            <Trash className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}