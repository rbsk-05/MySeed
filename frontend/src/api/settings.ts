import apiClient from './client';

export interface Settings {
  id: number;
  download_dir: string;
  max_active_downloads: number;
  max_download_speed: number;
  max_upload_speed: number;
}

export type SettingsUpdate = Omit<Settings, 'id'>;

export const getSettings = async (): Promise<Settings> => {
  const { data } = await apiClient.get('/settings');
  return data;
};

export const updateSettings = async (settings: SettingsUpdate): Promise<Settings> => {
  const { data } = await apiClient.put('/settings', settings);
  return data;
};
