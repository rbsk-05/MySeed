import { useState, useRef } from 'react';

interface AddTorrentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMagnet: (magnetUri: string) => void;
  onAddFile: (file: File) => void;
}

export const AddTorrentModal: React.FC<AddTorrentModalProps> = ({ isOpen, onClose, onAddMagnet, onAddFile }) => {
  const [activeTab, setActiveTab] = useState<'magnet' | 'file'>('magnet');
  const [magnetUri, setMagnetUri] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDropZoneActive, setIsDropZoneActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'magnet' && magnetUri.trim()) {
      onAddMagnet(magnetUri.trim());
      setMagnetUri('');
      onClose();
    } else if (activeTab === 'file' && selectedFile) {
      onAddFile(selectedFile);
      setSelectedFile(null);
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Auto-register directly when picked
      const file = e.target.files[0];
      onAddFile(file);
      onClose();
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropZoneActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onAddFile(file);
      onClose();
      return;
    }

    const text = e.dataTransfer.getData('text');
    if (text && text.trim().startsWith('magnet:?')) {
      onAddMagnet(text.trim());
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-xs p-4"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={handleFileDrop}
    >
      {/* Chill Beige Modal Card */}
      <div className="chill-card w-full max-w-lg p-6 bg-[#fffdf9] border-2 border-[#e9e2d5] shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#f0ebe1]">
          <div>
            <h2 className="text-lg font-bold text-[#292524] leading-tight">
              Add Torrent
            </h2>
            <p className="text-xs text-[#78716c]">
              Drop a file, or add a magnet link / .torrent file
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f5f0e8] hover:bg-[#e8dfd1] text-[#78716c] hover:text-[#292524] flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
            title="Cancel"
          >
            ✕
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              activeTab === 'magnet'
                ? 'bg-[#ea580c] text-white shadow-xs'
                : 'bg-[#f5f0e8] text-[#78716c] hover:bg-[#ebe3d5]'
            }`}
            onClick={() => setActiveTab('magnet')}
          >
            Magnet URI
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              activeTab === 'file'
                ? 'bg-[#ea580c] text-white shadow-xs'
                : 'bg-[#f5f0e8] text-[#78716c] hover:bg-[#ebe3d5]'
            }`}
            onClick={() => setActiveTab('file')}
          >
            .Torrent File
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'magnet' ? (
            <div>
              <label className="block text-xs font-bold text-[#292524] mb-1.5">
                Magnet URL:
              </label>
              <input 
                type="text" 
                value={magnetUri}
                onChange={(e) => setMagnetUri(e.target.value)}
                placeholder="magnet:?xt=urn:btih:..."
                className="w-full bg-[#f7f4ed] border-1.5 border-[#e2d9cb] rounded-2xl px-4 py-3 text-xs font-mono text-[#292524] focus:outline-none focus:border-[#ea580c] transition-colors"
                autoFocus
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-[#292524] mb-1.5">
                Select or Drop .torrent File:
              </label>
              <div 
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDropZoneActive 
                    ? 'border-[#ea580c] bg-[#ffedd5]' 
                    : 'border-[#e2d9cb] hover:border-[#ea580c] bg-[#f7f4ed]'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDropZoneActive(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDropZoneActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDropZoneActive(false);
                }}
                onDrop={handleFileDrop}
              >
                <input 
                  type="file" 
                  accept=".torrent"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                {selectedFile ? (
                  <p className="text-xs font-bold text-[#ea580c] font-mono">{selectedFile.name}</p>
                ) : (
                  <p className="text-xs text-[#78716c]">
                    <span className="font-bold text-[#ea580c]">Drop .torrent file here</span> or click to browse
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#f0ebe1]">
            <button 
              type="button" 
              onClick={onClose}
              className="chill-btn text-xs"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={(activeTab === 'magnet' && !magnetUri.trim()) || (activeTab === 'file' && !selectedFile)}
              className="chill-btn chill-btn-primary text-xs disabled:opacity-50"
            >
              Add Torrent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
