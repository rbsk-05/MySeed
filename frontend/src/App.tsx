
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Settings as SettingsIcon, LayoutDashboard } from 'lucide-react';
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

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-surface border-b border-border sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setCurrentView('dashboard')}
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
                T
              </div>
              <span className="font-semibold text-lg text-text tracking-wide">Torrent<span className="text-primary-light">Downloader</span></span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentView('dashboard')} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`}
                title="Dashboard"
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>
              <button 
                onClick={() => setCurrentView('settings')} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'settings' ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`}
                title="Settings"
              >
                <SettingsIcon size={18} />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {currentView === 'dashboard' ? <Dashboard /> : <SettingsPage />}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
