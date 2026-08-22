import apiClient from './client';
import type { Torrent } from '../types';

export const getTorrents = async (): Promise<Torrent[]> => {
  const { data } = await apiClient.get('/torrents');
  return data;
};

export const addMagnet = async (magnetUri: string): Promise<Torrent> => {
  const formData = new FormData();
  formData.append('magnet_uri', magnetUri);
  const { data } = await apiClient.post('/torrents/magnet', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const uploadFile = async (file: File): Promise<Torrent> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/torrents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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
