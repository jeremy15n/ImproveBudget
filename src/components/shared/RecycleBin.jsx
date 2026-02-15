import React, { useState } from 'react';
import { Trash2, RotateCcw, Trash, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';

/**
 * Reusable Recycle Bin Component
 *
 * Props:
 * - entityName: String (e.g., "Transaction", "Account")
 * - apiEntity: API client entity instance (e.g., apiClient.entities.Transaction)
 * - renderRow: Function to render each deleted item
 * - queryKey: Array for React Query invalidation
 */
export default function RecycleBin({ entityName, apiEntity, renderRow, queryKey }) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-slate-600" />
              Recycle Bin - {entityName}s
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
          ) : deletedItems.length === 0 ? (
            <div className="py-8 text-center">
              <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Recycle bin is empty</p>
            </div>
          ) : (
            <>
              {/* Bulk Actions */}
              {selectedIds.size > 0 && (
                <div className="mb-3 bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-700">
                    {selectedIds.size} selected
                  </span>
                  <Button
                    size="sm"
                    onClick={handleBulkRestore}
                    className="h-8 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Restore
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkHardDelete}
                    className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash className="w-3 h-3 mr-1" />
                    Delete Permanently
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                    className="h-8 ml-auto"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
              )}

              {/* Deleted Items List */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {deletedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                    />
                    <div className="flex-1">
                      {renderRow(item)}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => restoreMut.mutate(item.id)}
                        title="Restore"
                      >
                        <RotateCcw className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
