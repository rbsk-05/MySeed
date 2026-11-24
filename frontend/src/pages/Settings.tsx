import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings, browseDirectory } from '../api/settings';
import type { SettingsUpdate } from '../api/settings';
import { DirectoryPickerModal } from '../components/DirectoryPickerModal';

export const SettingsPage = ({ onBack }: { onBack?: () => void }) => {
  const queryClient = useQueryClient();
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const { data: browseInfo } = useQuery({
    queryKey: ['browse-directory-quick'],
    queryFn: () => browseDirectory(),
    staleTime: 60000,
  });

  const [formData, setFormData] = useState<SettingsUpdate>({
    download_dir: '',
    max_active_downloads: 3,
    max_download_speed: 0,
    max_upload_speed: 0,
  });

  const [toastMessage, setToastMessage] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [recentDir, setRecentDir] = useState<string>(() => {
    return localStorage.getItem('torrent_recent_dir') || '';
  });

  useEffect(() => {
    if (currentSettings) {
      setFormData({
        download_dir: currentSettings.download_dir,
        max_active_downloads: currentSettings.max_active_downloads,
        max_download_speed: currentSettings.max_download_speed,
        max_upload_speed: currentSettings.max_upload_speed,
      });

      if (!localStorage.getItem('torrent_recent_dir') && currentSettings.download_dir) {
        localStorage.setItem('torrent_recent_dir', currentSettings.download_dir);
        setRecentDir(currentSettings.download_dir);
      }
    }
  }, [currentSettings]);

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      if (formData.download_dir) {
        localStorage.setItem('torrent_recent_dir', formData.download_dir);
        setRecentDir(formData.download_dir);
      }
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

  // Determine paths for quick picks: Downloads, D Drive, and Recent/Current
  const downloadsPath =
    browseInfo?.quick_locations?.find((l) => l.name.toLowerCase() === 'downloads')?.path ||
    'C:\\Users\\mdars\\Downloads';

  const dDrivePath =
    browseInfo?.drives?.find((d) => d.toUpperCase().startsWith('D:')) || 'D:\\';

  const recentPath = recentDir || currentSettings?.download_dir || '';
  const recentName = recentPath
    ? recentPath.split(/[\\/]/).filter(Boolean).pop() || recentPath
    : '';

  const isRecentDistinct =
    Boolean(recentPath) &&
    recentPath.toLowerCase() !== downloadsPath.toLowerCase() &&
    recentPath.toLowerCase() !== dDrivePath.toLowerCase();

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
            className="chill-btn text-xs font-semibold"
          >
            Back
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
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  name="download_dir"
                  value={formData.download_dir}
                  onChange={handleChange}
                  className="flex-1 bg-[#f7f4ed] border-1.5 border-[#e2d9cb] rounded-2xl px-4 py-2.5 text-xs font-mono text-[#292524] focus:outline-none focus:border-[#ea580c] transition-colors"
                  placeholder="e.g. C:\Users\mdars\Downloads"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="chill-btn text-xs py-2.5 px-3.5 font-bold shrink-0 bg-[#f5f0e8] hover:bg-[#ede4d6] text-[#292524]"
                  title="Open folder browser"
                >
                  Locate Folder
                </button>
              </div>

              {/* Quick Pick: Only Downloads, D drive, and Recently selected folder */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="text-[11px] font-semibold text-[#a8a29e] mr-1">Quick pick:</span>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, download_dir: downloadsPath }))}
                  className={`chill-btn text-[11px] py-1 px-3 font-semibold transition-all ${
                    formData.download_dir.toLowerCase() === downloadsPath.toLowerCase()
                      ? 'bg-[#ea580c] text-white border-[#c2410c] shadow-xs'
                      : 'bg-[#faf6ee] hover:bg-[#f2ebdf] text-[#57534e]'
                  }`}
                  title={downloadsPath}
                >
                  Downloads
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, download_dir: dDrivePath }))}
                  className={`chill-btn text-[11px] py-1 px-3 font-semibold transition-all ${
                    formData.download_dir.toLowerCase() === dDrivePath.toLowerCase()
                      ? 'bg-[#ea580c] text-white border-[#c2410c] shadow-xs'
                      : 'bg-[#faf6ee] hover:bg-[#f2ebdf] text-[#57534e]'
                  }`}
                  title={dDrivePath}
                >
                  D Drive
                </button>

                {isRecentDistinct && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, download_dir: recentPath }))}
                    className={`chill-btn text-[11px] py-1 px-3 font-semibold transition-all ${
                      formData.download_dir.toLowerCase() === recentPath.toLowerCase()
                        ? 'bg-[#ea580c] text-white border-[#c2410c] shadow-xs'
                        : 'bg-[#faf6ee] hover:bg-[#f2ebdf] text-[#57534e]'
                    }`}
                    title={recentPath}
                  >
                    Recent: {recentName}
                  </button>
                )}
              </div>

              <p className="text-[11px] text-[#a8a29e] mt-2">
                Files will be saved to this folder. Use the quick pick shortcuts above or click Locate Folder to browse.
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
                  {toastMessage}
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
                  className="chill-btn text-xs font-semibold"
                >
                  Cancel
                </button>
              )}
              <button 
                type="submit" 
                disabled={mutation.isPending}
                className="chill-btn chill-btn-primary text-xs font-bold"
              >
                {mutation.isPending ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Directory Picker Modal */}
      <DirectoryPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        initialPath={formData.download_dir}
        onSelect={(path) => {
          setFormData((prev) => ({ ...prev, download_dir: path }));
          localStorage.setItem('torrent_recent_dir', path);
          setRecentDir(path);
          setToastMessage(`Selected: ${path}`);
          setTimeout(() => setToastMessage(''), 3000);
        }}
      />
    </div>
  );
};
