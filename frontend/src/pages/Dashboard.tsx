import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Server, ArrowDown, ArrowUp, DownloadCloud } from 'lucide-react';
import { getTorrents, addMagnet, uploadFile, pauseTorrent, resumeTorrent, removeTorrent } from '../api/torrents';
import { TorrentCard } from '../components/TorrentCard';
import { AddTorrentModal } from '../components/AddTorrentModal';
import { useTorrentWebSocket } from '../hooks/useWebSocket';

const formatSpeed = (bytes: number) => {
  if (!+bytes) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const totalDownloadSpeed = torrents?.reduce((acc, t) => acc + (t.download_speed || 0), 0) || 0;
  const totalUploadSpeed = torrents?.reduce((acc, t) => acc + (t.upload_speed || 0), 0) || 0;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2.5">
            <Server className="text-primary" size={24} />
            Downloads
          </h1>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ArrowDown size={13} /> {formatSpeed(totalDownloadSpeed)}
            </span>
            <span className="flex items-center gap-1 text-primary-light font-medium">
              <ArrowUp size={13} /> {formatSpeed(totalUploadSpeed)}
            </span>
            <span className="text-border">•</span>
            <span>{activeTorrents.length} active</span>
            <span className="text-border">•</span>
            <span>{completedTorrents.length} completed</span>
          </div>
        </div>
        
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2 text-sm shadow-md shadow-primary/20">
          <Plus size={18} />
          Add Torrent
        </button>
      </div>

      <div className="space-y-8">
        {/* Active Section */}
        <section>
          <h2 className="text-lg font-semibold mb-3 text-text-muted flex items-center gap-2">
            Active
            <span className="bg-surface px-2 py-0.5 rounded-full text-xs font-medium">{activeTorrents.length}</span>
          </h2>
          
          {isLoading ? (
            <div className="glass-panel p-8 text-center text-text-muted animate-pulse">
              Loading torrents...
            </div>
          ) : activeTorrents.length === 0 ? (
            <div className="glass-panel p-10 text-center border-dashed border-2 border-border/80">
              <DownloadCloud size={36} className="mx-auto text-text-muted/40 mb-2" />
              <p className="text-text-muted mb-3 text-sm">No active downloads.</p>
              <button onClick={() => setIsModalOpen(true)} className="btn btn-secondary text-xs">
                Add your first torrent
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
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

        {/* Completed Section */}
        {completedTorrents.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3 text-text-muted flex items-center gap-2">
              Completed
              <span className="bg-surface px-2 py-0.5 rounded-full text-xs font-medium">{completedTorrents.length}</span>
            </h2>
            <div className="flex flex-col gap-3">
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
