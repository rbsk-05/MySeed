import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Server } from 'lucide-react';
import { getTorrents, addMagnet, uploadFile, pauseTorrent, resumeTorrent, removeTorrent } from '../api/torrents';
import { TorrentCard } from '../components/TorrentCard';
import { AddTorrentModal } from '../components/AddTorrentModal';

import { useTorrentWebSocket } from '../hooks/useWebSocket';

export const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  useTorrentWebSocket(); // Start listening to real-time updates

  const { data: torrents, isLoading } = useQuery({
    queryKey: ['torrents'],
    queryFn: getTorrents,
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

  const activeTorrents = torrents?.filter(t => t.progress < 100) || [];
  const completedTorrents = torrents?.filter(t => t.progress >= 100) || [];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text flex items-center gap-3">
            <Server className="text-primary" size={32} />
            Dashboard
          </h1>
          <p className="text-text-muted mt-1">Manage your personal torrent downloads</p>
        </div>
        
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={20} />
          Add Torrent
        </button>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4 text-text-muted flex items-center gap-2">
            Active Downloads
            <span className="bg-surface px-2 py-0.5 rounded-full text-sm">{activeTorrents.length}</span>
          </h2>
          
          {isLoading ? (
            <div className="glass-panel p-8 text-center text-text-muted animate-pulse">
              Loading torrents...
            </div>
          ) : activeTorrents.length === 0 ? (
            <div className="glass-panel p-12 text-center border-dashed border-2 border-border">
              <p className="text-text-muted mb-4">No active downloads.</p>
              <button onClick={() => setIsModalOpen(true)} className="btn btn-secondary text-sm">
                Add your first torrent
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {activeTorrents.map((torrent) => (
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
        </section>

        {completedTorrents.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 text-text-muted flex items-center gap-2">
              Completed
              <span className="bg-surface px-2 py-0.5 rounded-full text-sm">{completedTorrents.length}</span>
            </h2>
            <div className="flex flex-col gap-4 opacity-80">
              {completedTorrents.map((torrent) => (
                <TorrentCard 
                  key={torrent.id} 
                  torrent={torrent}
                  onPause={(id) => pauseMutation.mutate(id)}
                  onResume={(id) => resumeMutation.mutate(id)}
                  onRemove={(id) => removeMutation.mutate(id)}
                />
              ))}
            </div>
          </section>
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
