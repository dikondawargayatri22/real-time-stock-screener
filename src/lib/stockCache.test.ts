import { describe, expect, it } from 'vitest';
import { getCachedStocks, saveCachedStocks } from './stockCache';

describe('stock cache server safety', () => {
  it('is a no-op when IndexedDB is unavailable', async () => {
    const original = globalThis.indexedDB;
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      value: undefined,
    });
    await expect(saveCachedStocks([])).resolves.toBeUndefined();
    await expect(getCachedStocks()).resolves.toBeNull();
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      value: original,
    });
  });
});
