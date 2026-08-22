import { useState, useRef } from 'react';
import { X, Link as LinkIcon, UploadCloud, File as FileIcon } from 'lucide-react';

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.torrent')) {
        setSelectedFile(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-muted hover:text-text bg-surface hover:bg-surface-hover rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <UploadCloud className="text-primary" />
          Add New Torrent
        </h2>

        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            type="button"
            className={`pb-2 px-2 border-b-2 transition-colors ${activeTab === 'magnet' ? 'border-primary text-primary font-medium' : 'border-transparent text-text-muted hover:text-text'}`}
            onClick={() => setActiveTab('magnet')}
          >
            Magnet Link
          </button>
          <button
            type="button"
            className={`pb-2 px-2 border-b-2 transition-colors ${activeTab === 'file' ? 'border-primary text-primary font-medium' : 'border-transparent text-text-muted hover:text-text'}`}
            onClick={() => setActiveTab('file')}
          >
            Torrent File
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === 'magnet' ? (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2 flex items-center gap-2">
                <LinkIcon size={16} /> Paste Magnet URI
              </label>
              <input 
                type="text" 
                value={magnetUri}
                onChange={(e) => setMagnetUri(e.target.value)}
                placeholder="magnet:?xt=urn:btih:..."
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                autoFocus
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2 flex items-center gap-2">
                <FileIcon size={16} /> Upload .torrent File
              </label>
              
              <div 
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:bg-surface-hover transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input 
                  type="file" 
                  accept=".torrent"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <UploadCloud className="mx-auto h-12 w-12 text-text-muted mb-4" />
                {selectedFile ? (
                  <p className="text-primary font-medium">{selectedFile.name}</p>
                ) : (
                  <p className="text-text-muted">
                    <span className="text-primary font-medium">Click to upload</span> or drag and drop<br/>
                    .torrent files only
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={(activeTab === 'magnet' && !magnetUri.trim()) || (activeTab === 'file' && !selectedFile)} 
              className="btn btn-primary"
            >
              Start Download
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
