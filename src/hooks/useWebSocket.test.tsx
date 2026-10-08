import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWebSocket } from './useWebSocket';
import { useStockStore } from '../stores/useStockStore';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn(() => this.onclose?.());
  readyState = 0;
  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  message(updates: Record<string, number>) {
    this.onmessage?.({ data: JSON.stringify({ type: 'prices', updates }) });
  }
}

describe('useWebSocket', () => {
  afterEach(() => {
    MockWebSocket.instances = [];
    vi.unstubAllGlobals();
  });

  it('connects, subscribes, and applies real price updates', async () => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    useStockStore.setState({
      stocks: [
        { id: 'market_AAPL', price: 100, change: 0, changePercent: 0 } as never,
      ],
    });
    const { result } = renderHook(() => useWebSocket(['market_AAPL'], true));
    const socket = MockWebSocket.instances[0];
    act(() => socket.open());
    expect(result.current).toBe('open');
    expect(socket.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'subscribe', stockIds: ['market_AAPL'] })
    );
    act(() => socket.message({ market_AAPL: 110 }));
    await waitFor(() =>
      expect(useStockStore.getState().stocks[0].price).toBe(110)
    );
  });

  it('stays closed when disabled', () => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    const { result } = renderHook(() => useWebSocket([], false));
    expect(result.current).toBe('closed');
    expect(MockWebSocket.instances).toHaveLength(0);
  });
});
