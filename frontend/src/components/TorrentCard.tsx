
import React from 'react';
import { 
  Play, 
  Pause, 
  Trash2, 
  HardDrive, 
  Users, 
  ArrowDown, 
  ArrowUp, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import type { Torrent } from '../types';

interface TorrentCardProps {
  torrent: Torrent;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
  onRemove: (id: number) => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const formatETA = (seconds: number) => {
  if (!seconds || seconds <= 0 || seconds > 31536000) return '∞';
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

export const TorrentCard: React.FC<TorrentCardProps> = ({ torrent, onPause, onResume, onRemove }) => {
  const isPaused = torrent.is_paused || torrent.status === 'paused';
  const isCompleted = torrent.progress >= 100 || torrent.status === 'finished' || torrent.status === 'seeding';
  const progressPercent = Math.min(100, Math.max(0, torrent.progress)).toFixed(1);

  // Status badge logic
  const getStatusBadge = () => {
    if (hasActualError(torrent.error)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertCircle size={12} />
          Error
        </span>
      );
    }
    if (isPaused) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-700/40 text-text-muted border border-zinc-700">
          <Pause size={12} />
          Paused
        </span>
      );
    }
    if (isCompleted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle size={12} />
          {torrent.status === 'seeding' ? 'Seeding' : 'Completed'}
        </span>
      );
    }
    if (torrent.status === 'downloading metadata' || torrent.name === 'Downloading Metadata...') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
          <Loader2 size={12} className="animate-spin" />
          Fetching Metadata...
        </span>
      );
    }
    if (torrent.status === 'checking' || torrent.status === 'allocating') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Clock size={12} />
          Verifying Files
        </span>
      );
    }
    if (torrent.download_speed > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          Downloading
        </span>
      );
    }
    if (torrent.peers > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
          Connected ({torrent.peers} peers)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
        Connecting...
      </span>
    );
  };

  return (
    <div className="glass-panel p-4 mb-3 transition-all duration-200 hover:border-primary/40 group relative overflow-hidden">
      {/* Top row: Title, status pill, and action buttons */}
      <div className="flex justify-between items-start mb-2.5 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {getStatusBadge()}
            <div className="flex items-center gap-1 text-xs text-text-muted bg-surface/80 px-2 py-0.5 rounded-md border border-border/50">
              <Users size={12} className="text-primary-light" />
              <span>{torrent.seeds || 0} seeds • {torrent.peers || 0} peers</span>
            </div>
          </div>
          <h3 className="text-base font-semibold truncate text-text" title={torrent.name}>
            {torrent.name || 'Downloading Torrent...'}
          </h3>
          {hasActualError(torrent.error) && (
            <div className="text-xs text-danger mt-1">
              Error: {torrent.error}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 bg-surface/90 p-1 rounded-lg border border-border/60 shadow-sm shrink-0">
          {isPaused ? (
            <button 
              onClick={() => onResume(torrent.id)} 
              className="p-1.5 hover:bg-secondary/20 text-secondary rounded-md transition-colors"
              title="Resume Download"
            >
              <Play size={16} />
            </button>
          ) : (
            <button 
              onClick={() => onPause(torrent.id)} 
              className="p-1.5 hover:bg-amber-500/20 text-amber-400 rounded-md transition-colors"
              title="Pause Download"
            >
              <Pause size={16} />
            </button>
          )}
          <button 
            onClick={() => onRemove(torrent.id)} 
            className="p-1.5 hover:bg-danger/20 text-danger rounded-md transition-colors"
            title="Remove Torrent"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full transition-all duration-300 ease-out rounded-full ${
            isCompleted 
              ? 'bg-emerald-500' 
              : isPaused 
                ? 'bg-zinc-600' 
                : 'bg-primary'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Bottom stats row */}
      <div className="flex flex-wrap justify-between text-xs text-text-muted items-center gap-3">
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-sm ${isCompleted ? 'text-emerald-400' : torrent.download_speed > 0 ? 'text-text' : 'text-text-muted'}`}>
            {progressPercent}%
          </span>
        </div>
        
        <div className="flex gap-4 sm:gap-6 flex-wrap items-center">
          <div className="flex items-center gap-1">
            <ArrowDown size={13} className={torrent.download_speed > 0 ? "text-emerald-400" : "text-text-muted"} />
            <span className={torrent.download_speed > 0 ? "text-emerald-400 font-medium" : "text-text-muted"}>
              {formatBytes(torrent.download_speed)}/s
            </span>
          </div>

          <div className="flex items-center gap-1">
            <ArrowUp size={13} className={torrent.upload_speed > 0 ? "text-primary-light" : "text-text-muted"} />
            <span className={torrent.upload_speed > 0 ? "text-primary-light font-medium" : "text-text-muted"}>
              {formatBytes(torrent.upload_speed)}/s
            </span>
          </div>

          <div>
            <span>ETA: </span>
            <span className="text-text font-medium">
              {isCompleted ? 'Done' : (torrent.download_speed > 0 ? formatETA(torrent.eta) : isPaused ? 'Paused' : '—')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-surface/70 px-2.5 py-1 rounded-md border border-border/60">
          <HardDrive size={12} className="text-primary-light" />
          <span>{formatBytes(torrent.downloaded)} / {formatBytes(torrent.size || 0)}</span>
        </div>
      </div>
    </div>
  );
};
