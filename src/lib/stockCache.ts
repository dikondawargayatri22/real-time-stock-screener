import { Stock } from '@/types';

const DB_NAME = 'stock-screener';
const STORE_NAME = 'cache';
const STOCKS_KEY = 'stocks';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCachedStocks(stocks: Stock[]) {
  if (typeof indexedDB === 'undefined') return;
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction
      .objectStore(STORE_NAME)
      .put({ savedAt: Date.now(), stocks }, STOCKS_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function getCachedStocks(): Promise<Stock[] | null> {
  if (typeof indexedDB === 'undefined') return null;
  const database = await openDatabase();
  const value = await new Promise<{ stocks?: Stock[] } | undefined>(
    (resolve, reject) => {
      const request = database
        .transaction(STORE_NAME, 'readonly')
        .objectStore(STORE_NAME)
        .get(STOCKS_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }
  );
  database.close();
  return value?.stocks ?? null;
}
