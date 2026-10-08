import { useEffect, useRef, useState } from 'react';
import { useStockStore } from '../stores/useStockStore';

export type ConnectionStatus =
  'connecting' | 'open' | 'reconnecting' | 'closed';

type PriceMessage = { type?: string; updates?: Record<string, number> };

export function useWebSocket(
  stockIds: string[],
  enabled: boolean
): ConnectionStatus {
  const updatePrices = useStockStore((state) => state.updatePrices);
  const [status, setStatus] = useState<ConnectionStatus>('closed');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef<number | null>(null);
  const attemptRef = useRef(0);
  const idsKey = stockIds.join(',');

  useEffect(() => {
    if (!enabled || !stockIds.length) {
      setStatus('closed');
      return undefined;
    }

    let disposed = false;
    const subscribedIds = idsKey.split(',');
    const connect = () => {
      if (disposed) return;
      setStatus(attemptRef.current ? 'reconnecting' : 'connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(
        `${protocol}//${window.location.host}/api/ws`
      );
      socketRef.current = socket;
      socket.onopen = () => {
        attemptRef.current = 0;
        setStatus('open');
        socket.send(
          JSON.stringify({ type: 'subscribe', stockIds: subscribedIds })
        );
      };
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data)) as PriceMessage;
          if (!message.updates) return;
          if (frameRef.current) cancelAnimationFrame(frameRef.current);
          frameRef.current = requestAnimationFrame(() =>
            updatePrices(message.updates ?? {})
          );
        } catch {
          // Ignore malformed provider messages and keep the connection alive.
        }
      };
      socket.onclose = () => {
        if (disposed) return;
        attemptRef.current += 1;
        reconnectRef.current = setTimeout(
          connect,
          Math.min(1_000 * 2 ** (attemptRef.current - 1), 10_000)
        );
      };
      socket.onerror = () => socket.close();
    };

    connect();
    return () => {
      disposed = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      socketRef.current?.close();
    };
  }, [enabled, idsKey, updatePrices]);

  return status;
}
