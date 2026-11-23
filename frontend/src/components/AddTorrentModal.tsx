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
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      {/* 90s Windows Dialog Box */}
      <div className="win-window w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-100">
        {/* Dialog Title Bar */}
        <div className="win-titlebar">
          <div className="flex items-center gap-1.5">
            <span>💾</span>
            <span>Add New Torrent</span>
          </div>
          <button 
            onClick={onClose}
            className="win-btn-title"
            title="Cancel"
          >
            ✕
          </button>
        </div>

        <div className="p-3 bg-[#c0c0c0] text-xs">
          {/* Tab Strip */}
          <div className="flex gap-1 mb-3 border-b border-[#808080]">
            <button
              type="button"
              className={`px-3 py-1 text-xs border-t-2 border-l-2 border-r-2 ${
                activeTab === 'magnet'
                  ? 'border-white border-r-[#404040] bg-[#c0c0c0] font-bold -mb-[1px] z-10'
                  : 'border-[#dfdfdf] border-r-[#808080] bg-[#a0a0a0] text-[#303030]'
              }`}
              onClick={() => setActiveTab('magnet')}
            >
              Magnet Link
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-xs border-t-2 border-l-2 border-r-2 ${
                activeTab === 'file'
                  ? 'border-white border-r-[#404040] bg-[#c0c0c0] font-bold -mb-[1px] z-10'
                  : 'border-[#dfdfdf] border-r-[#808080] bg-[#a0a0a0] text-[#303030]'
              }`}
              onClick={() => setActiveTab('file')}
            >
              .Torrent File
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {activeTab === 'magnet' ? (
              <fieldset className="win-fieldset">
                <legend>Magnet URI Stream</legend>
                <p className="text-[11px] text-[#404040] mb-2">
                  Paste the magnet link from your clipboard:
                </p>
                <input 
                  type="text" 
                  value={magnetUri}
                  onChange={(e) => setMagnetUri(e.target.value)}
                  placeholder="magnet:?xt=urn:btih:..."
                  className="win-inset w-full px-2 py-1.5 font-mono text-xs text-black bg-white outline-none"
                  autoFocus
                />
              </fieldset>
            ) : (
              <fieldset className="win-fieldset">
                <legend>Local .Torrent File</legend>
                <p className="text-[11px] text-[#404040] mb-2">
                  Select a .torrent file from your local disk:
                </p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly
                    value={selectedFile ? selectedFile.name : 'No file selected'}
                    className="win-inset flex-1 px-2 py-1 font-mono text-xs text-[#505050] bg-white outline-none"
                  />
                  <input 
                    type="file" 
                    accept=".torrent"
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="win-btn font-bold whitespace-nowrap"
                  >
                    Browse...
                  </button>
                </div>
              </fieldset>
            )}

            {/* Dialog Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#808080]">
              <button 
                type="submit" 
                disabled={(activeTab === 'magnet' && !magnetUri.trim()) || (activeTab === 'file' && !selectedFile)}
                className="win-btn win-btn-default min-w-[70px] disabled:opacity-50"
              >
                OK
              </button>
              <button 
                type="button" 
                onClick={onClose} 
                className="win-btn min-w-[70px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
