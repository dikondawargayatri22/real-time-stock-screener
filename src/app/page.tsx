'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useStockStore } from '../stores/useStockStore';
import { StockTable } from '../components/StockTable';
import { Stock } from '../types';
import { filterStocks } from '../lib/filterEngine';
import { FilterPanel } from '../components/filters/FilterPanel';
import { getCachedStocks, saveCachedStocks } from '../lib/stockCache';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useWebSocket } from '../hooks/useWebSocket';

const StockChart = dynamic(
  () => import('../components/StockChart').then((module) => module.StockChart),
  {
    ssr: false,
    loading: () => (
      <section
        aria-busy="true"
        className="flex h-full min-h-72 items-center justify-center bg-white text-sm text-gray-500"
      >
        Loading chart…
      </section>
    ),
  }
);

export default function Home() {
  const { stocks, setStocks, filters, setFilters } = useStockStore();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [fullScreenChart, setFullScreenChart] = useState(false);
  const isOnline = useOnlineStatus();
  const connectionStatus = useWebSocket(
    stocks.map((stock) => stock.id),
    isOnline
  );
  const filteredStocks = useMemo(
    () => filterStocks(stocks, filters),
    [stocks, filters]
  );
  const selectStock = useCallback(
    (stock: Stock) => setSelectedStock(stock),
    []
  );
  const toggleFullScreen = useCallback(
    () => setFullScreenChart((value) => !value),
    []
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['stocks'],
    queryFn: async () => {
      const response = await fetch('/api/stocks');
      if (!response.ok)
        throw new Error('Live market data is currently unavailable.');
      const payload = (await response.json()) as { data: Stock[] };
      return payload.data;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    enabled: isOnline,
  });

  useEffect(() => {
    void getCachedStocks().then((cached) => {
      if (cached?.length && !useStockStore.getState().stocks.length)
        setStocks(cached);
    });
  }, [setStocks]);

  useEffect(() => {
    if (data) {
      setStocks(data);
      void saveCachedStocks(data);
    }
  }, [data, setStocks]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-white p-4 text-black sm:p-8">
      <div className="flex h-[calc(100vh-2rem)] w-full flex-col gap-4 sm:h-[90vh]">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">
            Real-Time Stock Screener
          </h1>
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${connectionStatus === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
          >
            {connectionStatus === 'open' ? 'Live' : connectionStatus}
          </span>
        </div>
        {!isOnline && (
          <div
            role="status"
            className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800"
          >
            You are offline. Showing the most recently cached stock data.
          </div>
        )}
        {error && !stocks.length && (
          <div
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {error.message}
          </div>
        )}
        {isLoading && !stocks.length ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-500">Loading live market data...</span>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-auto rounded-md border border-gray-200 lg:flex-row lg:overflow-hidden">
            <FilterPanel
              stocks={filteredStocks}
              filters={filters}
              onChange={setFilters}
            />
            <div
              className={`min-h-[22rem] min-w-0 flex-1 ${fullScreenChart ? 'hidden' : 'block'}`}
            >
              <StockTable data={filteredStocks} onRowClick={selectStock} />
            </div>
            <div
              className={`${fullScreenChart ? 'w-full' : 'w-full border-t border-gray-200 lg:w-1/2 lg:border-l lg:border-t-0'} min-h-[28rem] min-w-0`}
            >
              <StockChart
                stock={selectedStock}
                fullScreen={fullScreenChart}
                onToggleFullScreen={toggleFullScreen}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
