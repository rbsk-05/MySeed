import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { getSettings, updateSettings } from '../api/settings';
import type { SettingsUpdate } from '../api/settings';

export const SettingsPage = () => {
  const queryClient = useQueryClient();
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const [formData, setFormData] = useState<SettingsUpdate>({
    download_dir: '',
    max_active_downloads: 3,
    max_download_speed: 0,
    max_upload_speed: 0,
  });

  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (currentSettings) {
      setFormData({
        download_dir: currentSettings.download_dir,
        max_active_downloads: currentSettings.max_active_downloads,
        max_download_speed: currentSettings.max_download_speed,
        max_upload_speed: currentSettings.max_upload_speed,
      });
    }
  }, [currentSettings]);

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setToastMessage('Settings saved successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-text-muted animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="text-primary" size={32} />
        <h1 className="text-3xl font-bold text-text">Settings</h1>
      </div>

      <div className="glass-panel p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <section>
            <h2 className="text-lg font-semibold text-text mb-4 border-b border-border pb-2">General</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Default Download Directory
                </label>
                <input
                  type="text"
                  name="download_dir"
                  value={formData.download_dir}
                  onChange={handleChange}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
                <p className="text-xs text-text-muted mt-1">Absolute path where downloaded files will be saved.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-4 border-b border-border pb-2">Queue & Limits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Maximum Active Downloads
                </label>
                <input
                  type="number"
                  name="max_active_downloads"
                  value={formData.max_active_downloads}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Max Download Speed (KB/s)
                </label>
                <input
                  type="number"
                  name="max_download_speed"
                  value={formData.max_download_speed}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
                <p className="text-xs text-text-muted mt-1">Set to 0 for unlimited.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Max Upload Speed (KB/s)
                </label>
                <input
                  type="number"
                  name="max_upload_speed"
                  value={formData.max_upload_speed}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
                <p className="text-xs text-text-muted mt-1">Set to 0 for unlimited.</p>
              </div>
            </div>
          </section>

          <div className="pt-4 flex items-center justify-between">
            {toastMessage ? (
              <span className="text-secondary font-medium animate-in fade-in">{toastMessage}</span>
            ) : (
              <span></span>
            )}
            
            <button 
              type="submit" 
              className="btn btn-primary flex items-center gap-2"
              disabled={mutation.isPending}
            >
              <Save size={18} />
              {mutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
