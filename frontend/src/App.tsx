
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './pages/Dashboard';
import { SettingsPage } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => 
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* 90s Desktop Canvas */}
      <div 
        className="w-full h-screen overflow-hidden flex flex-col justify-between select-none relative"
        style={{ backgroundColor: '#008080' }}
        onClick={() => { if (startMenuOpen) setStartMenuOpen(false); }}
      >
        {/* Desktop Icons on Top-Left */}
        <div className="absolute top-4 left-4 flex flex-col gap-5 z-0">
          <div 
            className="flex flex-col items-center gap-1 w-20 cursor-pointer group"
            onDoubleClick={() => { setIsMinimized(false); setCurrentView('dashboard'); }}
          >
            <div className="w-10 h-10 flex items-center justify-center text-2xl drop-shadow">
              💾
            </div>
            <span className="text-[11px] text-white text-center px-1 font-mono tracking-tight group-hover:bg-[#000080] group-hover:outline-dotted group-hover:outline-1">
              Torrent Client
            </span>
          </div>

          <div 
            className="flex flex-col items-center gap-1 w-20 cursor-pointer group"
            onDoubleClick={() => { setIsMinimized(false); setCurrentView('settings'); }}
          >
            <div className="w-10 h-10 flex items-center justify-center text-2xl drop-shadow">
              ⚙️
            </div>
            <span className="text-[11px] text-white text-center px-1 font-mono tracking-tight group-hover:bg-[#000080] group-hover:outline-dotted group-hover:outline-1">
              Settings
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 w-20 cursor-pointer group">
            <div className="w-10 h-10 flex items-center justify-center text-2xl drop-shadow">
              🗑️
            </div>
            <span className="text-[11px] text-white text-center px-1 font-mono tracking-tight group-hover:bg-[#000080] group-hover:outline-dotted group-hover:outline-1">
              Recycle Bin
            </span>
          </div>
        </div>

        {/* The Main Windows 95 Application Window */}
        {!isMinimized ? (
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 z-10 overflow-hidden">
            <div 
              className={`win-window flex flex-col transition-all duration-100 ${
                isMaximized 
                  ? 'w-full h-full' 
                  : 'w-full max-w-5xl h-[92vh] max-h-[820px]'
              }`}
            >
              {/* Window Title Bar */}
              <div className="win-titlebar">
                <div className="flex items-center gap-2">
                  <span className="text-sm">💾</span>
                  <span className="font-bold text-xs tracking-wide">
                    Personal Torrent Downloader v1.0 [Win95 Edition]
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsMinimized(true)}
                    className="win-btn-title"
                    title="Minimize"
                  >
                    _
                  </button>
                  <button 
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="win-btn-title"
                    title={isMaximized ? "Restore" : "Maximize"}
                  >
                    {isMaximized ? '❐' : '□'}
                  </button>
                  <button 
                    onClick={() => setIsMinimized(true)}
                    className="win-btn-title"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Classic Win95 Menu Bar */}
              <div className="bg-[#c0c0c0] border-b border-[#808080] px-2 py-1 flex items-center gap-4 text-xs">
                <span 
                  className="cursor-pointer hover:bg-[#000080] hover:text-white px-1.5 py-0.5"
                  onClick={() => setCurrentView('dashboard')}
                >
                  <u>F</u>ile
                </span>
                <span 
                  className={`cursor-pointer px-1.5 py-0.5 ${currentView === 'dashboard' ? 'bg-[#000080] text-white font-bold' : 'hover:bg-[#000080] hover:text-white'}`}
                  onClick={() => setCurrentView('dashboard')}
                >
                  <u>T</u>ransfers
                </span>
                <span 
                  className={`cursor-pointer px-1.5 py-0.5 ${currentView === 'settings' ? 'bg-[#000080] text-white font-bold' : 'hover:bg-[#000080] hover:text-white'}`}
                  onClick={() => setCurrentView('settings')}
                >
                  <u>O</u>ptions
                </span>
                <span 
                  className="cursor-pointer hover:bg-[#000080] hover:text-white px-1.5 py-0.5"
                  onClick={() => alert("Personal Torrent Client 1995 Edition.\nPure local BitTorrent client.")}
                >
                  <u>H</u>elp
                </span>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 bg-[#c0c0c0] p-2 overflow-auto flex flex-col min-h-0">
                {currentView === 'dashboard' ? <Dashboard /> : <SettingsPage onBack={() => setCurrentView('dashboard')} />}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Windows 95 Start Menu Popup */}
        {startMenuOpen && (
          <div 
            className="win-window absolute bottom-8 left-0 w-52 z-50 flex"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Blue Side Banner */}
            <div className="bg-[#000080] text-white w-7 flex items-end justify-center pb-3">
              <span className="font-bold text-sm tracking-widest -rotate-90 origin-bottom-left whitespace-nowrap">
                WIN95 TORRENT
              </span>
            </div>
            {/* Menu Items */}
            <div className="flex-1 bg-[#c0c0c0] py-1 flex flex-col text-xs">
              <button 
                onClick={() => { setCurrentView('dashboard'); setIsMinimized(false); setStartMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#000080] hover:text-white flex items-center gap-2"
              >
                <span>💾</span>
                <span>Transfers Manager</span>
              </button>
              <button 
                onClick={() => { setCurrentView('settings'); setIsMinimized(false); setStartMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#000080] hover:text-white flex items-center gap-2"
              >
                <span>⚙️</span>
                <span>Preferences</span>
              </button>
              <div className="border-t border-[#808080] border-b border-white my-1" />
              <button 
                onClick={() => { alert("Personal Torrent Client [1995 Edition]\nPowered by FastAPI & libtorrent"); setStartMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#000080] hover:text-white flex items-center gap-2"
              >
                <span>ℹ️</span>
                <span>About...</span>
              </button>
            </div>
          </div>
        )}

        {/* Windows 95 Bottom Taskbar */}
        <div className="h-8 bg-[#c0c0c0] border-t-2 border-white flex items-center justify-between px-1 z-40 shrink-0">
          <div className="flex items-center gap-1.5 h-full py-0.5">
            {/* Start Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); setStartMenuOpen(!startMenuOpen); }}
              className={`h-full px-2 flex items-center gap-1 text-xs font-bold ${
                startMenuOpen 
                  ? 'win-btn border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-[#b0b0b0]' 
                  : 'win-btn'
              }`}
            >
              <span className="text-sm">🪟</span>
              <span>Start</span>
            </button>

            {/* Separator */}
            <div className="w-[2px] h-5 bg-[#808080] border-r border-white mx-0.5" />

            {/* Active Window Task Tab */}
            <button 
              onClick={() => setIsMinimized(!isMinimized)}
              className={`h-full px-3 flex items-center gap-1.5 text-xs text-left max-w-xs truncate ${
                !isMinimized 
                  ? 'win-status-inset bg-[#e0e0e0] font-bold' 
                  : 'win-btn'
              }`}
            >
              <span>💾</span>
              <span className="truncate">Personal Torrent Downloader</span>
            </button>
          </div>

          {/* System Tray (Notification Area) */}
          <div className="win-status-inset h-6 flex items-center gap-2 px-2 text-xs">
            <span title="Connected to BitTorrent Network">🖧</span>
            <span title="Disk Storage OK">💽</span>
            <span className="font-mono text-[11px] text-black">{currentTime}</span>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
