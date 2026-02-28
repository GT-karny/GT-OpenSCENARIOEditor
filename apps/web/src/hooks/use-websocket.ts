import { useEffect, useRef, useState, useCallback } from 'react';
import type { WsClientMessage, WsServerMessage, ConnectionStatus } from '../types/ws-messages';

const DEFAULT_HEARTBEAT_INTERVAL = 30_000;
const DEFAULT_MAX_RETRIES = 10;
const MAX_BACKOFF_MS = 30_000;

export interface UseWebSocketOptions {
  url: string;
  enabled?: boolean;
  heartbeatInterval?: number;
  reconnectMaxRetries?: number;
  onMessage?: (msg: WsServerMessage) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

export interface UseWebSocketReturn {
  status: ConnectionStatus;
  send: (msg: WsClientMessage) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    enabled = true,
    heartbeatInterval = DEFAULT_HEARTBEAT_INTERVAL,
    reconnectMaxRetries = DEFAULT_MAX_RETRIES,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  // Refs to keep latest callbacks without re-triggering effects
  const onMessageRef = useRef(options.onMessage);
  onMessageRef.current = options.onMessage;
  const onStatusChangeRef = useRef(options.onStatusChange);
  onStatusChangeRef.current = options.onStatusChange;

  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalCloseRef = useRef(false);

  const updateStatus = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus);
    onStatusChangeRef.current?.(newStatus);
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const send = useCallback((msg: WsClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    heartbeatRef.current = setInterval(() => {
      send({ type: 'ping' });
    }, heartbeatInterval);
  }, [heartbeatInterval, send, clearHeartbeat]);

  const connect = useCallback(() => {
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    clearHeartbeat();
    clearRetryTimeout();
    intentionalCloseRef.current = false;
    updateStatus('connecting');

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryCountRef.current = 0;
      updateStatus('connected');
      startHeartbeat();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsServerMessage;
        onMessageRef.current?.(msg);
      } catch (err) {
        console.warn('[WebSocket] Failed to parse message:', err);
      }
    };

    ws.onerror = () => {
      updateStatus('error');
    };

    ws.onclose = () => {
      clearHeartbeat();
      wsRef.current = null;

      if (intentionalCloseRef.current) {
        updateStatus('disconnected');
        return;
      }

      // Auto-reconnect with exponential backoff
      if (retryCountRef.current < reconnectMaxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), MAX_BACKOFF_MS);
        retryCountRef.current++;
        updateStatus('disconnected');
        retryTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        updateStatus('error');
      }
    };
  }, [url, reconnectMaxRetries, updateStatus, clearHeartbeat, clearRetryTimeout, startHeartbeat]);

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    clearRetryTimeout();
    clearHeartbeat();
    retryCountRef.current = 0;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    updateStatus('disconnected');
  }, [clearRetryTimeout, clearHeartbeat, updateStatus]);

  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    connect();
  }, [connect]);

  // Connect/disconnect based on enabled flag
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      intentionalCloseRef.current = true;
      clearRetryTimeout();
      clearHeartbeat();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, url]); // eslint-disable-line react-hooks/exhaustive-deps

  return { status, send, disconnect, reconnect };
}
