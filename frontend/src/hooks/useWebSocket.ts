import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Torrent } from '../types';

export const useTorrentWebSocket = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Dynamically determine protocol and host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // If in development (Vite), point to backend port, else use current host
    const host = window.location.port === '5173' || window.location.port === '5174' 
      ? 'localhost:8000' 
      : window.location.host;
      
    const ws = new WebSocket(`${protocol}//${host}/api/ws/torrents`);

    ws.onmessage = (event) => {
      try {
        const torrents: Torrent[] = JSON.parse(event.data);
        // Directly update the React Query cache
        queryClient.setQueryData(['torrents'], torrents);
      } catch (err) {
        console.error('Failed to parse websocket message', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    return () => {
      ws.close();
    };
  }, [queryClient]);
};
