import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTorrents, addMagnet, uploadFile, pauseTorrent, resumeTorrent, removeTorrent } from '../api/torrents';
import { TorrentCard } from '../components/TorrentCard';
import { AddTorrentModal } from '../components/AddTorrentModal';
import { useTorrentWebSocket } from '../hooks/useWebSocket';

export const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
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

  const activeTorrents = torrents?.filter(t => t.progress < 100 && t.status !== 'finished' && t.status !== 'seeding') || [];
  const completedTorrents = torrents?.filter(t => t.progress >= 100 || t.status === 'finished' || t.status === 'seeding') || [];

  const displayedTorrents = filter === 'active' 
    ? activeTorrents 
    : filter === 'completed' 
      ? completedTorrents 
      : (torrents || []);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292524] tracking-tight">
            Ciné<span className="text-[#ea580c]">Torrent</span>
          </h1>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="chill-btn chill-btn-primary text-xs shadow-xs"
        >
          + Add Torrent
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-[#292524] text-white shadow-xs'
              : 'bg-[#fffdf9] text-[#78716c] hover:bg-[#f0ebe1] border border-[#e2d9cb]'
          }`}
        >
          All Titles ({torrents?.length || 0})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
            filter === 'active'
              ? 'bg-[#ea580c] text-white shadow-xs'
              : 'bg-[#fffdf9] text-[#78716c] hover:bg-[#f0ebe1] border border-[#e2d9cb]'
          }`}
        >
          Now Rolling ({activeTorrents.length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
            filter === 'completed'
              ? 'bg-[#16a34a] text-white shadow-xs'
              : 'bg-[#fffdf9] text-[#78716c] hover:bg-[#f0ebe1] border border-[#e2d9cb]'
          }`}
        >
          Ready to Screen ({completedTorrents.length})
        </button>
      </div>

      {/* Main List */}
      <div>
        {isLoading ? (
          <div className="chill-card p-12 text-center text-sm font-medium text-[#78716c] animate-pulse">
            Loading torrents...
          </div>
        ) : displayedTorrents.length === 0 ? (
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
            {displayedTorrents.map((torrent) => (
              <TorrentCard 
                key={torrent.id}
                torrent={torrent}
                onPause={(id) => pauseMutation.mutate(id)}
                onResume={(id) => resumeMutation.mutate(id)}
                onRemove={(id) => removeMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      <AddTorrentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAddMagnet={(uri) => addMagnetMutation.mutate(uri)}
        onAddFile={(file) => uploadFileMutation.mutate(file)}
      />
    </div>
  );
};
