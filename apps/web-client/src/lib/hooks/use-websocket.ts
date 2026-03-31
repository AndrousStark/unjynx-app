'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const WS_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.unjynx.me').replace(/^http/, 'ws') + '/ws'
  : '';

interface WsEvent {
  readonly type: string;
  readonly payload: Record<string, unknown>;
}

/**
 * WebSocket hook for real-time updates.
 * Automatically reconnects on disconnection.
 * Invalidates React Query caches based on event type.
 */
export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const getToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    const cookieMatch = document.cookie.match(/(?:^|;\s*)unjynx_token=([^;]*)/);
    if (cookieMatch?.[1]) return decodeURIComponent(cookieMatch[1]);
    return localStorage.getItem('unjynx_token');
  }, []);

  const handleEvent = useCallback((event: WsEvent) => {
    switch (event.type) {
      case 'message_created':
      case 'message_updated':
      case 'message_deleted':
        // Invalidate messages for the affected channel
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        queryClient.invalidateQueries({ queryKey: ['messaging-unread'] });
        break;

      case 'task_created':
      case 'task_updated':
      case 'task_completed':
      case 'task_deleted':
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['sprint-tasks'] });
        break;

      case 'channel_updated':
        queryClient.invalidateQueries({ queryKey: ['messaging-channels'] });
        break;

      case 'member_joined':
      case 'member_left':
      case 'member_role_changed':
        queryClient.invalidateQueries({ queryKey: ['org-members'] });
        break;

      case 'sprint_updated':
        queryClient.invalidateQueries({ queryKey: ['sprints'] });
        break;

      case 'notification':
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        break;

      case 'pong':
        // Heartbeat response — no action needed
        break;

      default:
        // Unknown event — log but don't crash
        if (process.env.NODE_ENV === 'development') {
          console.debug('[ws] Unknown event:', event.type);
        }
    }
  }, [queryClient]);

  const connect = useCallback(() => {
    const token = getToken();
    if (!token || typeof window === 'undefined') return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[ws] Connected');
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsEvent;
        handleEvent(data);
      } catch {
        // Non-JSON message — ignore
      }
    };

    ws.onclose = (event) => {
      if (event.code !== 4001) {
        // Auto-reconnect after 3 seconds (unless unauthorized)
        reconnectTimerRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      // Will trigger onclose → reconnect
    };

    // Heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping', payload: {} }));
      }
    }, 30_000);

    // Cleanup heartbeat on close
    const origClose = ws.onclose;
    ws.onclose = (event) => {
      clearInterval(heartbeat);
      if (origClose) origClose.call(ws, event);
    };
  }, [getToken, handleEvent]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);
}
