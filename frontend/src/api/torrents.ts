import apiClient from './client';
import type { Torrent } from '../types';

export const getTorrents = async (): Promise<Torrent[]> => {
  const { data } = await apiClient.get('/torrents');
  return data;
};

export const addMagnet = async (magnetUri: string): Promise<Torrent> => {
  const formData = new FormData();
  formData.append('magnet_uri', magnetUri);
  // Do not manually set 'Content-Type': 'multipart/form-data'; Axios & browser set it with boundary
  const { data } = await apiClient.post('/torrents/magnet', formData);
  return data;
};

export const uploadFile = async (file: File): Promise<Torrent> => {
  const formData = new FormData();
  formData.append('file', file);
  // Do not manually set 'Content-Type': 'multipart/form-data'; Axios & browser set it with boundary
  const { data } = await apiClient.post('/torrents/upload', formData);
  return data;
};

export const pauseTorrent = async (id: number): Promise<Torrent> => {
  const { data } = await apiClient.post(`/torrents/${id}/pause`);
  return data;
};

export const resumeTorrent = async (id: number): Promise<Torrent> => {
  const { data } = await apiClient.post(`/torrents/${id}/resume`);
  return data;
};

export const removeTorrent = async (id: number, deleteFiles: boolean = false): Promise<void> => {
  await apiClient.delete(`/torrents/${id}?delete_files=${deleteFiles}`);
};

export const bulkDeleteTorrents = async (ids: number[], deleteFiles: boolean = false): Promise<{ deleted: number[]; count: number }> => {
  try {
    const { data } = await apiClient.post('/torrents/bulk-delete', { ids, delete_files: deleteFiles });
    return data;
  } catch (err) {
    // Robust parallel fallback via individual DELETE /torrents/{id}?delete_files=...
    await Promise.all(ids.map(id => removeTorrent(id, deleteFiles)));
    return { deleted: ids, count: ids.length };
  }
};
