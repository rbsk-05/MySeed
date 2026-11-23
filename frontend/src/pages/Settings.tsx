import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '../api/settings';
import type { SettingsUpdate } from '../api/settings';

export const SettingsPage = ({ onBack }: { onBack?: () => void }) => {
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
      setToastMessage('Settings saved');
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
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center text-sm font-medium text-[#78716c] animate-pulse">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e9e2d5]">
        <div>
          <h1 className="text-2xl font-bold text-[#292524] tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-[#78716c]">
            Configure download directory and speed limits
          </p>
        </div>

        {onBack && (
          <button 
            type="button" 
            onClick={onBack}
            className="chill-btn text-xs"
          >
            ← Back
          </button>
        )}
      </div>

      <div className="chill-card p-6 sm:p-8 bg-[#fffdf9]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Storage Section */}
          <div className="pb-6 border-b border-[#f0ebe1]">
            <h3 className="text-sm font-bold text-[#292524] mb-3">
              Download Directory
            </h3>
            <div>
              <label className="block text-xs font-semibold text-[#78716c] mb-1.5">
                Download Path:
              </label>
              <input
                type="text"
                name="download_dir"
                value={formData.download_dir}
                onChange={handleChange}
                className="w-full bg-[#f7f4ed] border-1.5 border-[#e2d9cb] rounded-2xl px-4 py-2.5 text-xs font-mono text-[#292524] focus:outline-none focus:border-[#ea580c] transition-colors"
                required
              />
              <p className="text-[11px] text-[#a8a29e] mt-1.5">
                Directory where downloaded files are saved.
              </p>
            </div>
          </div>

          {/* Limits & Throttling */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#292524] mb-3">
              Speed Limits
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#f7f4ed] p-3.5 rounded-2xl border border-[#e2d9cb]">
                <label className="block text-xs font-bold text-[#292524] mb-1">
                  Active Downloads
                </label>
                <input
                  type="number"
                  name="max_active_downloads"
                  value={formData.max_active_downloads}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-white border border-[#d6cbb9] rounded-xl px-3 py-1.5 text-xs font-mono text-[#292524] font-bold outline-none"
                  required
                />
                <span className="text-[10px] text-[#78716c] mt-1 block">Max concurrent downloads</span>
              </div>

              <div className="bg-[#f7f4ed] p-3.5 rounded-2xl border border-[#e2d9cb]">
                <label className="block text-xs font-bold text-[#292524] mb-1">
                  Max Download Speed
                </label>
                <input
                  type="number"
                  name="max_download_speed"
                  value={formData.max_download_speed}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-white border border-[#d6cbb9] rounded-xl px-3 py-1.5 text-xs font-mono text-[#ea580c] font-bold outline-none"
                  required
                />
                <span className="text-[10px] text-[#78716c] mt-1 block">KB/s (0 = unlimited)</span>
              </div>

              <div className="bg-[#f7f4ed] p-3.5 rounded-2xl border border-[#e2d9cb]">
                <label className="block text-xs font-bold text-[#292524] mb-1">
                  Max Upload Speed
                </label>
                <input
                  type="number"
                  name="max_upload_speed"
                  value={formData.max_upload_speed}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-white border border-[#d6cbb9] rounded-xl px-3 py-1.5 text-xs font-mono text-[#0284c7] font-bold outline-none"
                  required
                />
                <span className="text-[10px] text-[#78716c] mt-1 block">KB/s (0 = unlimited)</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-5 border-t border-[#f0ebe1]">
            <div>
              {toastMessage ? (
                <span className="text-xs font-bold text-[#15803d] bg-[#dcfce7] border border-[#86efac] px-3 py-1 rounded-full animate-in fade-in">
                  ✓ {toastMessage}
                </span>
              ) : (
                <span />
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {onBack && (
                <button 
                  type="button" 
                  onClick={onBack}
                  className="chill-btn text-xs"
                >
                  Cancel
                </button>
              )}
              <button 
                type="submit" 
                disabled={mutation.isPending}
                className="chill-btn chill-btn-primary text-xs"
              >
                {mutation.isPending ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
