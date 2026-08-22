
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LogOut, Settings as SettingsIcon, LayoutDashboard } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { SettingsPage } from './pages/Settings';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');

  if (!token) {
    return <Login />;
  }

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
                className={`p-2 rounded-lg transition-colors ${currentView === 'dashboard' ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`}
                title="Dashboard"
              >
                <LayoutDashboard size={20} />
              </button>
              <button 
                onClick={() => setCurrentView('settings')} 
                className={`p-2 rounded-lg transition-colors ${currentView === 'settings' ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`}
                title="Settings"
              >
                <SettingsIcon size={20} />
              </button>
              <div className="w-px h-6 bg-border mx-2"></div>
              <button onClick={logout} className="p-2 text-text-muted hover:text-danger rounded-lg transition-colors hover:bg-surface-hover" title="Logout">
                <LogOut size={20} />
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
