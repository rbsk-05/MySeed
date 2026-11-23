
import React from 'react';
import type { Torrent } from '../types';

interface TorrentCardProps {
  torrent: Torrent;
  index?: number;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
  onRemove: (id: number) => void;
}

const formatBytes = (bytes: number, decimals = 1) => {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const formatETA = (seconds: number) => {
  if (!seconds || seconds <= 0 || seconds > 31536000) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
};

const hasActualError = (error?: string): boolean => {
  if (!error) return false;
  const trimmed = error.trim().toLowerCase();
  if (!trimmed || trimmed === 'the operation completed successfully' || trimmed.includes('completed successfully')) {
    return false;
  }
  return true;
};

export const TorrentCard: React.FC<TorrentCardProps> = ({ 
  torrent, 
  index = 1, 
  onPause, 
  onResume, 
  onRemove 
}) => {
  const isPaused = torrent.is_paused || torrent.status === 'paused';
  const isCompleted = torrent.progress >= 100 || torrent.status === 'finished' || torrent.status === 'seeding';
  const progressPercent = Math.min(100, Math.max(0, torrent.progress)).toFixed(1);

  const getStatusText = () => {
    if (hasActualError(torrent.error)) return 'ERROR';
    if (isPaused) return 'PAUSED';
    if (isCompleted) return torrent.status === 'seeding' ? 'SEEDING' : 'FINISHED';
    if (torrent.status === 'downloading metadata' || torrent.name === 'Downloading Metadata...') return 'METADATA';
    if (torrent.status === 'checking' || torrent.status === 'allocating') return 'CHECKING';
    if (torrent.download_speed > 0) return 'DOWNLOADING';
    if (torrent.peers > 0) return `ACTIVE (${torrent.peers})`;
    return 'CONNECTING';
  };

  const getStatusColor = () => {
    if (hasActualError(torrent.error)) return 'text-[#800000] font-bold';
    if (isPaused) return 'text-[#505050]';
    if (isCompleted) return 'text-[#008000] font-bold';
    if (torrent.download_speed > 0) return 'text-[#000080] font-bold';
    return 'text-[#000000]';
  };

  return (
    <tr className="border-b border-[#dfdfdf] hover:bg-[#000080] hover:text-white group text-xs font-sans transition-none select-none">
      {/* Index */}
      <td className="px-2 py-1.5 text-center font-mono text-[#505050] group-hover:text-white w-8">
        {index}
      </td>

      {/* Name */}
      <td className="px-2 py-1.5 font-medium max-w-[220px] sm:max-w-[320px]">
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 text-sm">💾</span>
          <span className="truncate block" title={torrent.name}>
            {torrent.name || 'Downloading Torrent...'}
          </span>
        </div>
        {hasActualError(torrent.error) && (
          <div className="text-[10px] text-red-600 group-hover:text-red-300 font-mono">
            ! {torrent.error}
          </div>
        )}
      </td>

      {/* Size */}
      <td className="px-2 py-1.5 font-mono text-right whitespace-nowrap">
        {formatBytes(torrent.size || 0)}
      </td>

      {/* Segmented Progress Bar */}
      <td className="px-2 py-1.5 min-w-[140px]">
        <div className="flex items-center gap-1.5">
          <div className="win-progress-track flex-1 h-3.5 bg-white">
            <div 
              className={
                isCompleted 
                  ? 'win-progress-bar-done' 
                  : isPaused 
                    ? 'win-progress-bar-paused' 
                    : 'win-progress-bar'
              }
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-mono text-[11px] font-bold w-12 text-right group-hover:text-white">
            {progressPercent}%
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-2 py-1.5 whitespace-nowrap">
        <span className={`px-1 py-0.2 bg-[#dfdfdf] border border-[#808080] text-[10px] font-mono group-hover:bg-[#1084d0] group-hover:border-white group-hover:text-white ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </td>

      {/* Down Speed */}
      <td className="px-2 py-1.5 font-mono text-right whitespace-nowrap text-[#008000] font-bold group-hover:text-[#a0ffa0]">
        {torrent.download_speed > 0 ? `${formatBytes(torrent.download_speed)}/s` : '—'}
      </td>

      {/* Up Speed */}
      <td className="px-2 py-1.5 font-mono text-right whitespace-nowrap text-[#000080] font-bold group-hover:text-[#a0c0ff]">
        {torrent.upload_speed > 0 ? `${formatBytes(torrent.upload_speed)}/s` : '—'}
      </td>

      {/* ETA */}
      <td className="px-2 py-1.5 font-mono text-right whitespace-nowrap group-hover:text-white">
        {isCompleted ? 'Done' : (torrent.download_speed > 0 ? formatETA(torrent.eta) : isPaused ? 'Paused' : '—')}
      </td>

      {/* Seeds / Peers */}
      <td className="px-2 py-1.5 font-mono text-center whitespace-nowrap group-hover:text-white">
        {torrent.seeds || 0} / {torrent.peers || 0}
      </td>

      {/* Action Controls */}
      <td className="px-2 py-1.5 whitespace-nowrap text-right">
        <div className="inline-flex items-center gap-1">
          {isPaused ? (
            <button 
              onClick={(e) => { e.stopPropagation(); onResume(torrent.id); }}
              className="win-btn text-[10px] py-0.5 px-1.5 group-hover:text-black"
              title="Resume Download"
            >
              ▶ Resume
            </button>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); onPause(torrent.id); }}
              className="win-btn text-[10px] py-0.5 px-1.5 group-hover:text-black"
              title="Pause Download"
            >
              ⏸ Pause
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(torrent.id); }}
            className="win-btn text-[10px] py-0.5 px-1.5 text-[#800000] font-bold group-hover:text-[#800000]"
            title="Remove Torrent"
          >
            ✕ Del
          </button>
        </div>
      </td>
    </tr>
  );
};
