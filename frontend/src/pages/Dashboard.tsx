import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

  const totalDownloadSpeed = torrents?.reduce((acc, t) => acc + (t.download_speed || 0), 0) || 0;
  const totalUploadSpeed = torrents?.reduce((acc, t) => acc + (t.upload_speed || 0), 0) || 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#c0c0c0]">
      {/* 90s Client Toolbar */}
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-[#808080] flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="win-btn win-btn-default font-bold"
          >
            <span>➕</span>
            <span>Add Torrent...</span>
          </button>

          <div className="w-[2px] h-5 bg-[#808080] border-r border-white mx-1" />

          {/* Filter Buttons */}
          <button 
            onClick={() => setFilter('all')}
            className={`text-xs px-2 py-0.5 ${filter === 'all' ? 'win-status-inset bg-[#e0e0e0] font-bold' : 'win-btn'}`}
          >
            All Transfers ({torrents?.length || 0})
          </button>
          <button 
            onClick={() => setFilter('active')}
            className={`text-xs px-2 py-0.5 ${filter === 'active' ? 'win-status-inset bg-[#e0e0e0] font-bold text-[#000080]' : 'win-btn'}`}
          >
            Downloading ({activeTorrents.length})
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={`text-xs px-2 py-0.5 ${filter === 'completed' ? 'win-status-inset bg-[#e0e0e0] font-bold text-[#008000]' : 'win-btn'}`}
          >
            Completed ({completedTorrents.length})
          </button>
        </div>

        {/* Real-time speed gauges */}
        <div className="flex items-center gap-2">
          <div className="win-status-inset px-2 py-0.5 text-xs font-mono">
            <span className="text-[#008000] font-bold">↓ DL:</span> {formatSpeed(totalDownloadSpeed)}
          </div>
          <div className="win-status-inset px-2 py-0.5 text-xs font-mono">
            <span className="text-[#000080] font-bold">↑ UL:</span> {formatSpeed(totalUploadSpeed)}
          </div>
        </div>
      </div>

      {/* 90s Win32 Transfer ListView Table */}
      <div className="win-inset flex-1 overflow-auto bg-white min-h-[220px]">
        <table className="w-full border-collapse text-left text-xs select-none">
          <thead className="sticky top-0 bg-[#c0c0c0] z-10 shadow-sm">
            <tr>
              <th className="win-outset px-2 py-1 text-center font-bold text-[11px] w-8">#</th>
              <th className="win-outset px-2 py-1 font-bold text-[11px]">Torrent Name</th>
              <th className="win-outset px-2 py-1 font-bold text-[11px] text-right">Size</th>
              <th className="win-outset px-2 py-1 font-bold text-[11px]">Progress</th>
              <th className="win-outset px-2 py-1 font-bold text-[11px]">Status</th>
              <th className="win-outset px-2 py-1 font-bold text-[11px] text-right">Down Speed</th>
              <th className="win-outset px-2 py-1 font-bold text-[11px] text-right">Up Speed</th>
              <th className="win-outset px-2 py-1 font-bold text-[11px] text-right">ETA</th>
              <th className="win-outset px-2 py-1 font-bold text-[11px] text-center">Seeds/Peers</th>
              <th className="win-outset px-2 py-1 font-bold text-[11px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="p-8 text-center font-mono text-xs text-[#505050]">
                  Querying torrent engine...
                </td>
              </tr>
            ) : displayedTorrents.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-12 text-center text-[#505050]">
                  <div className="font-mono text-sm mb-1">No torrents in current view.</div>
                  <div className="text-xs text-[#808080] mb-3">Click "Add Torrent..." to begin downloading files via Magnet URI or .torrent file.</div>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="win-btn"
                  >
                    ➕ Open Torrent File / Link
                  </button>
                </td>
              </tr>
            ) : (
              displayedTorrents.map((torrent, idx) => (
                <TorrentCard 
                  key={torrent.id}
                  torrent={torrent}
                  index={idx + 1}
                  onPause={(id) => pauseMutation.mutate(id)}
                  onResume={(id) => resumeMutation.mutate(id)}
                  onRemove={(id) => removeMutation.mutate(id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 90s Window Status Bar at Bottom */}
      <div className="flex items-center gap-1 mt-1 pt-1 text-xs shrink-0 select-none">
        <div className="win-status-inset px-2 py-0.5 text-[#000000] flex-1 truncate">
          {isLoading ? 'Connecting...' : `${displayedTorrents.length} torrent(s) listed`}
        </div>
        <div className="win-status-inset px-2 py-0.5 font-mono whitespace-nowrap">
          Active: <b className="text-[#000080]">{activeTorrents.length}</b>
        </div>
        <div className="win-status-inset px-2 py-0.5 font-mono whitespace-nowrap">
          Done: <b className="text-[#008000]">{completedTorrents.length}</b>
        </div>
        <div className="win-status-inset px-2 py-0.5 font-mono whitespace-nowrap text-[#008000]">
          D: {formatSpeed(totalDownloadSpeed)}
        </div>
        <div className="win-status-inset px-2 py-0.5 font-mono whitespace-nowrap text-[#000080]">
          U: {formatSpeed(totalUploadSpeed)}
        </div>
        <div className="win-status-inset px-2 py-0.5 font-mono text-[11px] whitespace-nowrap">
          DHT: Connected
        </div>
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
