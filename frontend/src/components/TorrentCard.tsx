
import { Play, Pause, Trash2, HardDrive } from 'lucide-react';
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
  if (!seconds) return '∞';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
};

export const TorrentCard: React.FC<TorrentCardProps> = ({ torrent, onPause, onResume, onRemove }) => {
  const isPaused = torrent.is_paused || torrent.status === 'paused';
  const progressPercent = torrent.progress > 0 ? torrent.progress.toFixed(1) : '0.0';

  return (
    <div className="glass-panel p-4 mb-4 transition-all duration-300 hover:shadow-2xl hover:border-primary/50 group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 mr-4 overflow-hidden">
          <h3 className="text-lg font-semibold truncate text-text" title={torrent.name}>
            {torrent.name}
          </h3>
          {torrent.error && (
            <div className="text-xs text-danger mt-1">
              Error: {torrent.error}
            </div>
          )}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isPaused ? (
            <button onClick={() => onResume(torrent.id)} className="p-2 bg-surface hover:bg-secondary/20 text-secondary rounded-lg transition-colors">
              <Play size={18} />
            </button>
          ) : (
            <button onClick={() => onPause(torrent.id)} className="p-2 bg-surface hover:bg-primary/20 text-primary rounded-lg transition-colors">
              <Pause size={18} />
            </button>
          )}
          <button onClick={() => onRemove(torrent.id)} className="p-2 bg-surface hover:bg-danger/20 text-danger rounded-lg transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full transition-all duration-500 ease-out rounded-full ${isPaused ? 'bg-text-muted' : 'bg-primary'}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex flex-wrap justify-between text-sm text-text-muted items-center gap-4">
        <div className="flex items-center gap-2 w-32">
          <span className="font-medium text-text">{progressPercent}%</span>
        </div>
        
        <div className="flex gap-4 flex-1">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-text-muted/60">Speed</span>
            <span className="text-secondary font-medium">↓ {formatBytes(torrent.download_speed)}/s</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-text-muted/60">Uploaded</span>
            <span className="text-primary-light font-medium">↑ {formatBytes(torrent.upload_speed)}/s</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-text-muted/60">ETA</span>
            <span>{torrent.progress >= 100 || torrent.status === 'finished' || torrent.status === 'seeding' ? 'Done' : formatETA(torrent.eta)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-surface px-3 py-1 rounded-md border border-border">
          <HardDrive size={14} className="text-primary-light" />
          <span>{formatBytes(torrent.downloaded)} / {formatBytes(torrent.size)}</span>
        </div>
      </div>
    </div>
  );
};
