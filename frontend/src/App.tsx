import { useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dashboard } from './pages/Dashboard';
import { SettingsPage } from './pages/Settings';
import { uploadFile, addMagnet } from './api/torrents';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);
  const dragCounter = useRef(0);
  const toastTimeoutRef = useRef<any>(null);
  const query = useQueryClient();

  const showToast = (message: string, isError = false) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, isError });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  };

  const uploadFileMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: (data) => {
      query.invalidateQueries({ queryKey: ['torrents'] });
      setCurrentView('dashboard');
      showToast(`Added torrent: ${data.name || 'File'}`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to add torrent';
      showToast(`Error: ${msg}`, true);
    },
  });

  const addMagnetMutation = useMutation({
    mutationFn: addMagnet,
    onSuccess: (data) => {
      query.invalidateQueries({ queryKey: ['torrents'] });
      setCurrentView('dashboard');
      showToast(`Added magnet: ${data.name || 'Torrent'}`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to add magnet link';
      showToast(`Error: ${msg}`, true);
    },
  });

  const uploadMutateRef = useRef(uploadFileMutation.mutate);
  uploadMutateRef.current = uploadFileMutation.mutate;

  const magnetMutateRef = useRef(addMagnetMutation.mutate);
  magnetMutateRef.current = addMagnetMutation.mutate;

  // Screen-wide drag and drop listener (drops file anywhere to immediately register)
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current++;
      setIsDraggingOver(true);
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDraggingOver(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDraggingOver(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          uploadMutateRef.current(files[i]);
        }
        setCurrentView('dashboard');
        return;
      }

      const text = e.dataTransfer?.getData('text');
      if (text && text.trim().startsWith('magnet:?')) {
        magnetMutateRef.current(text.trim());
        setCurrentView('dashboard');
      }
    };

    // Attach to both window and document to guarantee browser interception
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f4ed] text-[#292524] flex flex-col font-sans selection:bg-[#fed7aa] selection:text-[#c2410c] relative">
      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-2 duration-150">
          <div className={`chill-card px-4 py-2.5 shadow-xl border text-xs font-bold flex items-center gap-2 ${
            toast.isError 
              ? 'bg-[#fee2e2] text-[#b91c1c] border-[#fca5a5]' 
              : 'bg-[#dcfce7] text-[#15803d] border-[#86efac]'
          }`}>
            <span>{toast.isError ? '⚠️' : '✓'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Screen-Wide Drag and Drop Dropzone Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-[#292524]/50 backdrop-blur-xs flex items-center justify-center p-4 pointer-events-none select-none">
          <div className="chill-card bg-[#fffdf9] border-2 border-dashed border-[#ea580c] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-[#ffedd5] text-[#ea580c] border border-[#fed7aa] flex items-center justify-center text-xl mx-auto mb-3 font-mono font-bold">
              ↓
            </div>
            <h3 className="text-base font-bold text-[#292524] mb-1">
              Drop file to download
            </h3>
            <p className="text-xs text-[#78716c]">
              Release anywhere on screen to automatically register the torrent
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#fffdf9] border-b border-[#e9e2d5] sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div 
            className="cursor-pointer"
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="font-extrabold text-xl text-[#292524] tracking-tight">
              Ciné<span className="text-[#ea580c]">Torrent</span>
            </span>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`chill-btn text-xs font-bold ${
                currentView === 'dashboard'
                  ? 'bg-[#292524] text-white border-[#292524] hover:bg-[#1c1917]'
                  : 'text-[#78716c] hover:text-[#292524]'
              }`}
            >
              Torrents
            </button>
            <button 
              onClick={() => setCurrentView('settings')}
              className={`chill-btn text-xs font-bold ${
                currentView === 'settings'
                  ? 'bg-[#292524] text-white border-[#292524] hover:bg-[#1c1917]'
                  : 'text-[#78716c] hover:text-[#292524]'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'dashboard' ? (
          <Dashboard />
        ) : (
          <SettingsPage onBack={() => setCurrentView('dashboard')} />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
