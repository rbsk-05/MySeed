import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Torrent } from '../types';

export const useTorrentWebSocket = () => {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let isMounted = true;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (!isMounted) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In dev on different port, connect to backend at 8000; in prod/tunnels use window.location.host
      const host = (window.location.hostname === 'localhost' && window.location.port && window.location.port !== '8000')
        ? 'localhost:8000'
        : window.location.host;

      const wsUrl = `${protocol}//${host}/api/ws/torrents`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const torrents: Torrent[] = JSON.parse(event.data);
            if (Array.isArray(torrents)) {
              queryClient.setQueryData(['torrents'], torrents);
            }
          } catch (err) {
            console.error('Failed to parse websocket message', err);
          }
        };

        ws.onclose = () => {
          wsRef.current = null;
          if (isMounted) {
            // Auto-reconnect after 2 seconds
            reconnectTimeout = setTimeout(connect, 2000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        if (isMounted) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [queryClient]);
};
