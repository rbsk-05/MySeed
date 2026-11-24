import React from 'react';
import type { Torrent } from '../types';

interface TorrentCardProps {
  torrent: Torrent;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
  onRemove: (id: number) => void;
  variant?: 'default' | 'compact';
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
}

const formatBytes = (bytes: number, decimals = 1) => {
  if (!+bytes) return '0 MB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const formatETA = (seconds: number) => {
  if (!seconds || seconds <= 0 || seconds > 31536000) return 'Calculating...';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const hasActualError = (error?: string): boolean => {
  if (!error) return false;
  const trimmed = error.trim().toLowerCase();
  if (!trimmed || trimmed === 'the operation completed successfully' || trimmed.includes('completed successfully')) {
    return false;
  }
  return true;
};

// Compact Vintage 35mm Projector Playhead with Pixel-Perfect Integrated Light Beam
const CinemaProjectorSVG = ({ 
  isRolling, 
  isPaused 
}: { 
  isRolling: boolean; 
  isPaused: boolean; 
}) => (
  <div className="relative flex items-center justify-center select-none pointer-events-none">
    <svg 
      viewBox="0 0 52 22" 
      className={`w-10 h-4.5 drop-shadow-xs transition-all duration-300 ${
        isRolling ? 'projector-slide-rolling' : ''
      }`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="projectorLightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#fef08a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Amber Light Beam emanating seamlessly from lens barrel */}
      {isRolling && (
        <polygon 
          points="28,10.5 50,6.5 50,20.5 28,16.5" 
          fill="url(#projectorLightBeam)" 
          className="pointer-events-none" 
        />
      )}

      {/* Left Reel */}
      <circle cx="8" cy="5.5" r="4" fill="#18181b" stroke={isPaused ? "#78716c" : "#ea580c"} strokeWidth="1" />
      <circle cx="8" cy="5.5" r="1.5" fill="#facc15" />
      
      {/* Right Reel */}
      <circle cx="18" cy="5.5" r="4" fill="#18181b" stroke={isPaused ? "#78716c" : "#ea580c"} strokeWidth="1" />
      <circle cx="18" cy="5.5" r="1.5" fill="#facc15" />

      {/* Projector Body */}
      <rect x="4" y="8" width="18" height="11" rx="1.5" fill="#292524" stroke="#1c1917" strokeWidth="1" />
      
      {/* Transport Knob */}
      <circle cx="13" cy="13.5" r="2" fill="#57534e" />

      {/* Lens Barrel */}
      <path d="M22 11L28 9.5L28 17.5L22 16Z" fill="#57534e" stroke="#1c1917" strokeWidth="1" />
      <line x1="28" y1="9.5" x2="28" y2="17.5" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </div>
);

export const TorrentCard: React.FC<TorrentCardProps> = ({ 
  torrent, 
  onPause, 
  onResume, 
  onRemove,
  variant = 'default',
  isSelected = false,
  onToggleSelect
}) => {
  const isPaused = torrent.is_paused || torrent.status === 'paused';
  const isCompleted = torrent.progress >= 100 || torrent.status === 'finished' || torrent.status === 'seeding';
  const progressPercent = Math.min(100, Math.max(0, torrent.progress)).toFixed(1);
  const numProgress = parseFloat(progressPercent);
  const isActivelyRolling = !isPaused && !isCompleted && torrent.download_speed > 0;

  // Distinct Compact Card Ratio for completed items in "All Titles"
  if (variant === 'compact') {
    return (
      <div className={`chill-card p-3 transition-all duration-200 hover:shadow-xs flex flex-col justify-between bg-[#fffdf9] border border-[#e8dfd1] rounded-2xl h-full ${
        isSelected ? 'ring-2 ring-[#ea580c] bg-[#fffbf5]' : ''
      }`}>
        {/* Top: Checkbox, Title & Action Controls */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {onToggleSelect && (
              <input 
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(torrent.id)}
                className="w-3.5 h-3.5 rounded border-[#d6cbb9] text-[#ea580c] focus:ring-0 cursor-pointer accent-[#ea580c] shrink-0"
                title="Select for bulk action"
              />
            )}
            <span className="text-xs select-none" title="Ready to Screen">🍿</span>
            <h3 className="text-xs sm:text-sm font-bold text-[#292524] truncate" title={torrent.name}>
              {torrent.name || 'Untitled Torrent'}
            </h3>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isPaused ? (
              <button 
                onClick={() => onResume(torrent.id)}
                className="chill-btn bg-[#dcfce7] text-[#15803d] border-[#86efac] hover:bg-[#bbf7d0] text-[10px] py-0.5 px-2 font-semibold"
                title="Resume"
              >
                Resume
              </button>
            ) : (
              <button 
                onClick={() => onPause(torrent.id)}
                className="chill-btn text-[#78716c] hover:text-[#292524] text-[10px] py-0.5 px-2 font-semibold"
                title="Pause"
              >
                Pause
              </button>
            )}
            <button 
              onClick={() => onRemove(torrent.id)}
              className="chill-btn text-[#b91c1c] hover:bg-[#fee2e2] hover:border-[#fca5a5] text-[10px] py-0.5 px-1.5 font-bold"
              title="Remove"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Mini 35mm Celluloid Completed Filmstrip */}
        <div className="my-1.5">
          <div className="filmstrip-track h-2.5 rounded-sm relative shadow-inner overflow-hidden">
            {/* Top Sprockets */}
            <div className="absolute top-0 inset-x-0 h-0.5 filmstrip-sprockets pointer-events-none opacity-60" />
            
            {/* 100% Finished Film Frame */}
            <div className="h-full rounded-sm bg-gradient-to-r from-[#15803d] to-[#22c55e] w-full relative">
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, #000000 0px, #000000 1px, transparent 1px, transparent 16px)'
                }}
              />
            </div>

            {/* Bottom Sprockets */}
            <div className="absolute bottom-0 inset-x-0 h-0.5 filmstrip-sprockets pointer-events-none opacity-60" />
          </div>
        </div>

        {/* Bottom Details: Upload Speed, Seeds/Peers, Total Size */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#f0ebe1] text-[11px] font-mono text-[#78716c]">
          <div className="flex items-center gap-2 truncate">
            {torrent.upload_speed > 0 ? (
              <span className="text-[#0369a1] font-bold">
                ↑ {formatBytes(torrent.upload_speed)}/s
              </span>
            ) : (
              <span className="text-[#16a34a] font-semibold">Ready</span>
            )}
            <span>•</span>
            <span>{torrent.seeds || 0}s / {torrent.peers || 0}p</span>
          </div>

          <div className="bg-[#f5f0e8] px-1.5 py-0.5 rounded border border-[#e8dfd1] text-[#292524] font-bold shrink-0">
            {formatBytes(torrent.size || torrent.downloaded || 0)}
          </div>
        </div>
      </div>
    );
  }

  // Status Badge Logic (Clean, no emojis; "Ready to Screen" label removed)
  const getStatusBadge = () => {
    if (hasActualError(torrent.error)) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5]">
          Error
        </span>
      );
    }
    // "Ready to Screen" badge removed to maximize clean space when complete
    if (isCompleted) {
      return null;
    }
    if (isPaused) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f5f5f4] text-[#78716c] border border-[#d6d3d1]">
          Paused
        </span>
      );
    }
    if (torrent.status === 'downloading metadata' || torrent.name === 'Downloading Metadata...') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
          Metadata
        </span>
      );
    }
    // "Now Rolling" label removed as requested (user can see the filmstrip rolling)
    if (torrent.download_speed > 0) {
      return null;
    }
    if (torrent.peers > 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]">
          Connecting
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
        Finding Peers
      </span>
    );
  };

  return (
    <div className={`chill-card p-3 sm:p-3.5 mb-2.5 transition-all duration-200 hover:shadow-xs ${
      isSelected ? 'ring-2 ring-[#ea580c] bg-[#fffbf5]' : ''
    }`}>
      {/* Top Row: Checkbox, Title, Inline Status Badge, and Action Buttons (Space-optimized) */}
      <div className="flex items-center justify-between gap-2.5 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onToggleSelect && (
            <input 
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(torrent.id)}
              className="w-4 h-4 rounded border-[#d6cbb9] text-[#ea580c] focus:ring-0 cursor-pointer accent-[#ea580c] shrink-0"
              title="Select for bulk action"
            />
          )}
          <h3 className="text-sm sm:text-base font-bold text-[#292524] truncate" title={torrent.name}>
            {torrent.name || 'Untitled Torrent'}
          </h3>
          {getStatusBadge()}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isPaused ? (
            <button 
              onClick={() => onResume(torrent.id)}
              className="chill-btn bg-[#dcfce7] text-[#15803d] border-[#86efac] hover:bg-[#bbf7d0] text-xs py-1 px-2.5"
              title="Resume"
            >
              Resume
            </button>
          ) : (
            <button 
              onClick={() => onPause(torrent.id)}
              className="chill-btn text-[#78716c] hover:text-[#292524] text-xs py-1 px-2.5"
              title="Pause"
            >
              Pause
            </button>
          )}
          <button 
            onClick={() => onRemove(torrent.id)}
            className="chill-btn text-[#b91c1c] hover:bg-[#fee2e2] hover:border-[#fca5a5] text-xs py-1 px-2"
            title="Remove"
          >
            ✕
          </button>
        </div>
      </div>

      {hasActualError(torrent.error) && (
        <div className="text-xs text-red-600 font-mono mb-2">
          Error: {torrent.error}
        </div>
      )}

      {/* Standard Size 35mm Celluloid Filmstrip Progress Bar */}
      <div className="my-2">
        <div className="filmstrip-track h-4.5 rounded-md relative shadow-inner overflow-visible">
          {/* Top 35mm Sprocket Holes */}
          <div 
            className={`absolute top-0.5 inset-x-0 h-0.5 filmstrip-sprockets z-10 pointer-events-none ${
              isActivelyRolling ? 'filmstrip-sprockets-active' : ''
            }`}
          />

          {/* Exposed Film Frame (Progress Fill) */}
          <div 
            className={`h-full rounded-md transition-all duration-300 relative overflow-hidden ${
              isCompleted 
                ? 'bg-gradient-to-r from-[#15803d] to-[#22c55e]' 
                : isPaused
                  ? 'bg-gradient-to-r from-[#78716c] to-[#a8a29e]'
                  : 'bg-gradient-to-r from-[#b45309] via-[#ea580c] to-[#f59e0b]'
            }`}
            style={{ width: `${Math.max(2, numProgress)}%` }}
          >
            {/* Film Frame Divider Lines */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #000000 0px, #000000 1.5px, transparent 1.5px, transparent 20px)'
              }}
            />
          </div>

          {/* Bottom 35mm Sprocket Holes */}
          <div 
            className={`absolute bottom-0.5 inset-x-0 h-0.5 filmstrip-sprockets z-10 pointer-events-none ${
              isActivelyRolling ? 'filmstrip-sprockets-active' : ''
            }`}
          />

          {/* Sliding Cinema Projector Playhead (travels towards the end; disappears once downloaded) */}
          {!isCompleted && (
            <div 
              className="absolute top-1/2 pointer-events-none transition-all duration-300 z-20"
              style={{ 
                left: `${Math.max(2, Math.min(98, numProgress))}%`,
                transform: 'translate(-50%, -42%)'
              }}
            >
              <CinemaProjectorSVG 
                isRolling={isActivelyRolling} 
                isPaused={isPaused} 
              />
            </div>
          )}

          {/* Popcorn Milestone at end of progress bar */}
          <div 
            className="absolute right-1 top-1/2 -translate-y-1/2 text-xs z-10 select-none opacity-85 leading-none"
            title="Completed"
          >
            🍿
          </div>
        </div>

        {/* Percentage Label */}
        <div className="flex justify-between items-center text-[11px] font-mono text-[#78716c] mt-1 px-0.5">
          <span className="font-bold text-xs text-[#292524]">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Bottom Readouts: Download, Upload, ETA, Seeds/Peers, File Size */}
      <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-[#f0ebe1] text-xs">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {/* Download Speed */}
          <div className="flex items-center gap-1 font-medium font-mono">
            <span>↓</span>
            <span className={torrent.download_speed > 0 ? "text-[#ea580c] font-bold" : "text-[#78716c]"}>
              {formatBytes(torrent.download_speed)}/s
            </span>
          </div>

          {/* Upload Speed */}
          <div className="flex items-center gap-1 font-medium font-mono">
            <span>↑</span>
            <span className="text-[#0369a1] font-bold">
              {formatBytes(torrent.upload_speed)}/s
            </span>
          </div>

          {/* ETA */}
          <div className="flex items-center gap-1 font-medium">
            <span>⏱️</span>
            <span className="text-[#78716c] text-xs">
              {isCompleted ? 'Complete' : isPaused ? 'Paused' : formatETA(torrent.eta)}
            </span>
          </div>

          {/* Seeds & Peers relocated here to remove vertical clutter */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#78716c]">
            <span>{torrent.seeds || 0} seeds</span>
            <span>•</span>
            <span>{torrent.peers || 0} peers</span>
          </div>
        </div>

        {/* File Size */}
        <div className="flex items-center gap-1.5 bg-[#f5f0e8] px-2 py-0.5 rounded-lg border border-[#e8dfd1] font-mono text-[11px]">
          <span className="text-[#292524] font-bold">{formatBytes(torrent.downloaded)}</span>
          <span className="text-[#78716c]">/</span>
          <span className="text-[#78716c]">{formatBytes(torrent.size || 0)}</span>
        </div>
      </div>
    </div>
  );
};
