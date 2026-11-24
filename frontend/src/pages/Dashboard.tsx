import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTorrents, addMagnet, uploadFile, pauseTorrent, resumeTorrent, removeTorrent, bulkDeleteTorrents } from '../api/torrents';
import { TorrentCard } from '../components/TorrentCard';
import { AddTorrentModal } from '../components/AddTorrentModal';
import { useTorrentWebSocket } from '../hooks/useWebSocket';

export const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteFilesOnDisk, setDeleteFilesOnDisk] = useState<boolean>(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);
  const queryClient = useQueryClient();

  useTorrentWebSocket();

  const { data: torrents, isLoading } = useQuery({
    queryKey: ['torrents'],
    queryFn: getTorrents,
    refetchInterval: 2000,
  });

  const addMagnetMutation = useMutation({
    mutationFn: addMagnet,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['torrents'] }),
  });

  const uploadFileMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['torrents'] }),
  });

  const pauseMutation = useMutation({
    mutationFn: pauseTorrent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['torrents'] }),
  });

  const resumeMutation = useMutation({
    mutationFn: resumeTorrent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['torrents'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeTorrent(id, false),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['torrents'] }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ ids, deleteFiles }: { ids: number[]; deleteFiles: boolean }) =>
      bulkDeleteTorrents(ids, deleteFiles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['torrents'] });
      setSelectedIds(new Set());
      setIsConfirmingDelete(false);
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['torrents'] });
      setSelectedIds(new Set());
      setIsConfirmingDelete(false);
    },
  });

  const activeTorrents = torrents?.filter(t => t.progress < 100 && t.status !== 'finished' && t.status !== 'seeding') || [];
  const completedTorrents = torrents?.filter(t => t.progress >= 100 || t.status === 'finished' || t.status === 'seeding') || [];

  const displayedTorrents = filter === 'active' 
    ? activeTorrents 
    : filter === 'completed' 
      ? completedTorrents 
      : (torrents || []);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const visibleIds = displayedTorrents.map((t) => t.id);
    const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setIsConfirmingDelete(false);
  };

  const executeBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDeleteMutation.mutate({
      ids: Array.from(selectedIds),
      deleteFiles: deleteFilesOnDisk,
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Action Bar: Filter tabs on left, Add Torrent on right (Non-repetitive layout) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setFilter('all')}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
              filter === 'all'
                ? 'bg-[#292524] text-white shadow-xs'
                : 'bg-[#fffdf9] text-[#78716c] hover:bg-[#f0ebe1] border border-[#e2d9cb]'
            }`}
          >
            All Titles ({torrents?.length || 0})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
              filter === 'active'
                ? 'bg-[#ea580c] text-white shadow-xs'
                : 'bg-[#fffdf9] text-[#78716c] hover:bg-[#f0ebe1] border border-[#e2d9cb]'
            }`}
          >
            Now Rolling ({activeTorrents.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
              filter === 'completed'
                ? 'bg-[#16a34a] text-white shadow-xs'
                : 'bg-[#fffdf9] text-[#78716c] hover:bg-[#f0ebe1] border border-[#e2d9cb]'
            }`}
          >
            Ready to Screen ({completedTorrents.length})
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {displayedTorrents.length > 0 && (
            <button
              onClick={handleSelectAll}
              className={`chill-btn text-xs cursor-pointer ${
                selectedIds.size > 0
                  ? 'bg-[#fed7aa] text-[#c2410c] border-[#f97316]'
                  : 'text-[#78716c]'
              }`}
              title="Select or deselect all visible titles"
            >
              {displayedTorrents.every((t) => selectedIds.has(t.id))
                ? 'Deselect All'
                : 'Select All'}
            </button>
          )}

          {/* Action Button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="chill-btn chill-btn-primary text-xs shadow-xs shrink-0"
          >
            + Add Torrent
          </button>
        </div>
      </div>

      {/* Main List */}
      <div>
        {isLoading ? (
          <div className="chill-card p-12 text-center text-sm font-medium text-[#78716c] animate-pulse">
            Loading torrents...
          </div>
        ) : filter === 'all' ? (
          (torrents?.length || 0) === 0 ? (
            <div className="chill-card p-12 text-center border-dashed border-2 border-[#e2d9cb]">
              <h3 className="text-base font-bold text-[#292524] mb-1">
                No torrents found
              </h3>
              <p className="text-xs text-[#78716c] mb-4 max-w-sm mx-auto">
                Add a magnet link or .torrent file to begin downloading.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="chill-btn chill-btn-primary text-xs"
              >
                + Add Torrent
              </button>
            </div>
          ) : (
            <div>
              {/* Active Downloads at the top so user immediately sees what is downloading */}
              {activeTorrents.length > 0 && (
                <div>
                  {activeTorrents.map((torrent) => (
                    <TorrentCard 
                      key={torrent.id}
                      torrent={torrent}
                      variant="default"
                      isSelected={selectedIds.has(torrent.id)}
                      isSelectMode={selectedIds.size > 0}
                      onToggleSelect={toggleSelect}
                      onPause={(id) => pauseMutation.mutate(id)}
                      onResume={(id) => resumeMutation.mutate(id)}
                      onRemove={(id) => removeMutation.mutate(id)}
                    />
                  ))}
                </div>
              )}

              {/* Ready to Screen / Completed (pushed to the bottom with distinct card ratio) */}
              {completedTorrents.length > 0 && (
                <div>
                  {activeTorrents.length > 0 && (
                    <div className="flex items-center gap-2.5 mt-4 mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716c]">
                        Ready to Screen ({completedTorrents.length})
                      </span>
                      <div className="h-px bg-[#e2d9cb] flex-1" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {completedTorrents.map((torrent) => (
                      <TorrentCard 
                        key={torrent.id}
                        torrent={torrent}
                        variant="compact"
                        isSelected={selectedIds.has(torrent.id)}
                        isSelectMode={selectedIds.size > 0}
                        onToggleSelect={toggleSelect}
                        onPause={(id) => pauseMutation.mutate(id)}
                        onResume={(id) => resumeMutation.mutate(id)}
                        onRemove={(id) => removeMutation.mutate(id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        ) : displayedTorrents.length === 0 ? (
          <div className="chill-card p-12 text-center border-dashed border-2 border-[#e2d9cb]">
            <h3 className="text-base font-bold text-[#292524] mb-1">
              {filter === 'active' ? 'No titles currently rolling' : 'No titles ready to screen'}
            </h3>
            <p className="text-xs text-[#78716c] mb-4 max-w-sm mx-auto">
              {filter === 'active' 
                ? 'All downloads have completed, or no torrents are active.' 
                : 'Torrents that finish downloading will appear here.'}
            </p>
            {filter === 'active' && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="chill-btn chill-btn-primary text-xs"
              >
                + Add Torrent
              </button>
            )}
          </div>
        ) : (
          /* "Now Rolling" or "Ready to Screen" tabs - standard design ratio preserved */
          <div>
            {displayedTorrents.map((torrent) => (
              <TorrentCard 
                key={torrent.id}
                torrent={torrent}
                variant="default"
                isSelected={selectedIds.has(torrent.id)}
                isSelectMode={selectedIds.size > 0}
                onToggleSelect={toggleSelect}
                onPause={(id) => pauseMutation.mutate(id)}
                onResume={(id) => resumeMutation.mutate(id)}
                onRemove={(id) => removeMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar - Tactile Shadow Theme matching .chill-btn */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div 
            className="bg-[#eee7dc] text-[#292524] px-5 py-3 border-[1.5px] border-[#d8cfc0] flex items-center gap-3.5 rounded-2xl select-none"
            style={{
              boxShadow: '0 4px 0 0 #cfc3b0, 0 14px 30px -4px rgba(41, 37, 36, 0.15)'
            }}
          >
            {isConfirmingDelete ? (
              /* In-App Inline Confirmation with Tactile Shadows */
              <div className="flex items-center gap-3 animate-in fade-in duration-150">
                <span className="text-xs font-black text-[#b91c1c]">
                  Delete {selectedIds.size} {selectedIds.size === 1 ? 'title' : 'titles'}
                  {deleteFilesOnDisk ? ' & files from disk' : ''}?
                </span>

                <button
                  onClick={executeBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  className="chill-btn bg-[#dc2626] hover:bg-[#ef4444] text-white border-[#b91c1c] text-xs py-1.5 px-3.5 font-bold cursor-pointer transition-all shadow-[0_2px_0_0_#991b1b] hover:shadow-[0_3px_0_0_#991b1b] active:shadow-[0_1px_0_0_#991b1b]"
                >
                  {bulkDeleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
                </button>

                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="chill-btn text-xs font-bold text-[#78716c] hover:text-[#292524] py-1 px-3"
                >
                  Cancel
                </button>
              </div>
            ) : (
              /* Standard Selection Toolbar */
              <>
                {/* Selected Count Badge & Text */}
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#ea580c] text-white flex items-center justify-center text-[11px] font-mono font-black shadow-[0_1.5px_0_0_#9a3412]">
                    {selectedIds.size}
                  </span>
                  <span className="text-xs font-black text-[#292524] tracking-wide">
                    Selected
                  </span>
                </div>

                <div className="h-4 w-px bg-[#d8cfc0]" />

                {/* Delete Files Checkbox - Tactile Ivory Capsule matching button shadows */}
                <label 
                  className="flex items-center gap-2 text-xs font-bold text-[#292524] cursor-pointer select-none bg-[#fffdf9] px-3 py-1.5 rounded-full border-[1.5px] border-[#e2d9cb] hover:bg-[#f7f4ed] hover:border-[#d6cbb9] transition-all"
                  style={{
                    boxShadow: '0 2px 0 0 #d6cbb9'
                  }}
                >
                  <input 
                    type="checkbox"
                    checked={deleteFilesOnDisk}
                    onChange={(e) => setDeleteFilesOnDisk(e.target.checked)}
                    className="w-4 h-4 rounded border-[#d8cfc0] text-[#ea580c] focus:ring-0 cursor-pointer accent-[#ea580c]"
                  />
                  <span className="text-[#292524] font-bold">Delete files from disk</span>
                </label>

                {/* Bulk Delete Button with Tactile Red Lip Shadow */}
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  className="chill-btn bg-[#dc2626] hover:bg-[#ef4444] text-white border-[#b91c1c] text-xs py-1.5 px-3.5 font-bold cursor-pointer transition-all shadow-[0_2px_0_0_#991b1b] hover:shadow-[0_3px_0_0_#991b1b] active:shadow-[0_1px_0_0_#991b1b]"
                >
                  Delete ({selectedIds.size})
                </button>

                {/* Clear Selection Button with chill-btn tactile styling */}
                <button
                  onClick={clearSelection}
                  className="chill-btn text-[#78716c] hover:text-[#292524] text-xs py-1 px-2.5 font-bold"
                  title="Clear selection"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <AddTorrentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAddMagnet={(uri) => addMagnetMutation.mutate(uri)}
        onAddFile={(file) => uploadFileMutation.mutate(file)}
      />
    </div>
  );
};
