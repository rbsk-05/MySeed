import apiClient from './client';

export interface Settings {
  id: number;
  download_dir: string;
  max_active_downloads: number;
  max_download_speed: number;
  max_upload_speed: number;
}

export type SettingsUpdate = Omit<Settings, 'id'>;

export interface QuickLocation {
  name: string;
  path: string;
}

export interface DirectoryBrowseResponse {
  current_path: string;
  parent_path: string | null;
  drives: string[];
  quick_locations: QuickLocation[];
  directories: string[];
}

export const getSettings = async (): Promise<Settings> => {
  const { data } = await apiClient.get('/settings');
  return data;
};

export const updateSettings = async (settings: SettingsUpdate): Promise<Settings> => {
  const { data } = await apiClient.put('/settings', settings);
  return data;
};

export const browseDirectory = async (path?: string): Promise<DirectoryBrowseResponse> => {
  const { data } = await apiClient.get('/settings/browse-directory', {
    params: path ? { path } : undefined,
  });
  return data;
};

export const browseNativeDirectory = async (initialDir?: string): Promise<{ path: string | null }> => {
  const { data } = await apiClient.post('/settings/browse-native', {
    initial_dir: initialDir,
  });
  return data;
};

export const createDirectory = async (path: string): Promise<{ path: string; success: boolean }> => {
  const { data } = await apiClient.post('/settings/create-directory', { path });
  return data;
};
