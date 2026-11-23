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

  const [activeTab, setActiveTab] = useState<'general' | 'bandwidth'>('general');
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
      setToastMessage('Properties updated successfully.');
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

  const handleOk = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData, {
      onSuccess: () => {
        if (onBack) onBack();
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center font-mono text-xs text-[#505050]">
        Loading configuration properties...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full p-2 text-xs">
      {/* 90s Properties Sheet */}
      <div>
        {/* Tab Strip */}
        <div className="flex gap-1 border-b border-[#808080] mb-3">
          <button
            type="button"
            className={`px-3 py-1 text-xs border-t-2 border-l-2 border-r-2 ${
              activeTab === 'general'
                ? 'border-white border-r-[#404040] bg-[#c0c0c0] font-bold -mb-[1px] z-10'
                : 'border-[#dfdfdf] border-r-[#808080] bg-[#a0a0a0] text-[#303030]'
            }`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-xs border-t-2 border-l-2 border-r-2 ${
              activeTab === 'bandwidth'
                ? 'border-white border-r-[#404040] bg-[#c0c0c0] font-bold -mb-[1px] z-10'
                : 'border-[#dfdfdf] border-r-[#808080] bg-[#a0a0a0] text-[#303030]'
            }`}
            onClick={() => setActiveTab('bandwidth')}
          >
            Bandwidth & Queue
          </button>
        </div>

        <form id="settings-form" onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'general' ? (
            <fieldset className="win-fieldset">
              <legend>Storage & Paths</legend>
              <div className="space-y-3 py-2">
                <div>
                  <label className="block text-[11px] font-bold text-black mb-1">
                    Default Download Directory:
                  </label>
                  <input
                    type="text"
                    name="download_dir"
                    value={formData.download_dir}
                    onChange={handleChange}
                    className="win-inset w-full px-2 py-1 font-mono text-xs bg-white text-black outline-none"
                    required
                  />
                  <p className="text-[10px] text-[#505050] mt-1">
                    Absolute directory path on your host where finished files will be saved.
                  </p>
                </div>
              </div>
            </fieldset>
          ) : (
            <fieldset className="win-fieldset">
              <legend>Queue Limits & Throttling</legend>
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-black">
                    Maximum Active Downloads:
                  </label>
                  <input
                    type="number"
                    name="max_active_downloads"
                    value={formData.max_active_downloads}
                    onChange={handleChange}
                    min="1"
                    className="win-inset w-24 px-2 py-1 font-mono text-xs bg-white text-black text-right outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-black">
                    Max Download Speed (KB/s, 0 = unlim):
                  </label>
                  <input
                    type="number"
                    name="max_download_speed"
                    value={formData.max_download_speed}
                    onChange={handleChange}
                    min="0"
                    className="win-inset w-24 px-2 py-1 font-mono text-xs bg-white text-black text-right outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-black">
                    Max Upload Speed (KB/s, 0 = unlim):
                  </label>
                  <input
                    type="number"
                    name="max_upload_speed"
                    value={formData.max_upload_speed}
                    onChange={handleChange}
                    min="0"
                    className="win-inset w-24 px-2 py-1 font-mono text-xs bg-white text-black text-right outline-none"
                    required
                  />
                </div>
              </div>
            </fieldset>
          )}
        </form>
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#808080]">
        <div>
          {toastMessage && (
            <span className="win-status-inset px-2 py-0.5 text-[#008000] font-mono text-[11px]">
              ✓ {toastMessage}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={handleOk}
            className="win-btn win-btn-default min-w-[75px]"
            disabled={mutation.isPending}
          >
            OK
          </button>
          <button 
            type="button" 
            onClick={() => { if (onBack) onBack(); }}
            className="win-btn min-w-[75px]"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="settings-form"
            className="win-btn min-w-[75px]"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
};
