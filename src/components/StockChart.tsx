'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CandlestickSeries,
  createChart,
  HistogramSeries,
  LineSeries,
} from 'lightweight-charts';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Stock } from '@/types';
import { createChartData, TIMEFRAMES } from '@/lib/chartData';
import { bollingerBands, ema, rsi, sma, volumeProfile } from '@/lib/indicators';

export function StockChart({
  stock,
  fullScreen,
  onToggleFullScreen,
}: {
  stock: Stock | null;
  fullScreen: boolean;
  onToggleFullScreen: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState('1M');
  const [tooltip, setTooltip] = useState('');
  const data = useMemo(
    () => (stock ? createChartData(stock, timeframe) : []),
    [stock, timeframe]
  );
  useEffect(() => {
    if (!container.current || !stock) return;
    const chart = createChart(container.current, {
      width: container.current.clientWidth,
      height: 420,
      layout: { background: { color: '#ffffff' }, textColor: '#374151' },
      grid: {
        vertLines: { color: '#f3f4f6' },
        horzLines: { color: '#f3f4f6' },
      },
      crosshair: { mode: 1 },
    });
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderVisible: false,
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626',
    });
    candles.setData(data);
    const addLine = (
      points: { time: string; value: number }[],
      color: string,
      pane = 0
    ) => {
      const series = chart.addSeries(
        LineSeries,
        {
          color,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        },
        pane
      );
      series.setData(points);
      return series;
    };
    addLine(sma(data, 20), '#2563eb');
    addLine(ema(data, 20), '#9333ea');
    const bands = bollingerBands(data);
    addLine(
      bands.map((point) => ({ time: point.time, value: point.upper })),
      '#94a3b8'
    );
    addLine(
      bands.map((point) => ({ time: point.time, value: point.lower })),
      '#94a3b8'
    );
    const volume = chart.addSeries(
      HistogramSeries,
      { priceFormat: { type: 'volume' }, priceScaleId: '' },
      1
    );
    volume.setData(
      data.map((bar) => ({
        time: bar.time,
        value: bar.volume,
        color: bar.close >= bar.open ? '#86efac' : '#fca5a5',
      }))
    );
    addLine(rsi(data), '#f59e0b', 2);
    const profile = volumeProfile(data);
    setTooltip(
      profile.length
        ? `Volume profile peak: ${Math.max(...profile.map((bin) => bin.volume)).toLocaleString()}`
        : ''
    );
    chart.subscribeCrosshairMove((param) => {
      if (!param.time) return;
      const bar = param.seriesData.get(candles) as
        { open: number; high: number; low: number; close: number } | undefined;
      if (bar)
        setTooltip(
          `${String(param.time)}  O ${bar.open.toFixed(2)}  H ${bar.high.toFixed(2)}  L ${bar.low.toFixed(2)}  C ${bar.close.toFixed(2)}`
        );
    });
    chart.timeScale().fitContent();
    const resize = () =>
      chart.applyOptions({ width: container.current?.clientWidth ?? 0 });
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      chart.remove();
    };
  }, [data, stock]);
  if (!stock)
    return (
      <section
        aria-live="polite"
        className="flex h-full min-h-72 items-center justify-center bg-white text-sm text-gray-500"
      >
        Select a stock from the grid to view its chart.
      </section>
    );
  return (
    <section aria-labelledby="chart-title" className="h-full bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <div>
          <h2 id="chart-title" className="font-semibold">
            {stock.symbol}{' '}
            <span className="font-normal text-gray-500">{stock.name}</span>
          </h2>
          <p className="text-xs text-gray-500">
            SMA 20 · EMA 20 · Bollinger Bands · RSI · Volume Profile
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {TIMEFRAMES.map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={timeframe === value}
              className={`rounded px-2 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${timeframe === value ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setTimeframe(value)}
            >
              {value}
            </button>
          ))}
          <button
            type="button"
            aria-label={
              fullScreen ? 'Exit full screen chart' : 'Full screen chart'
            }
            className="ml-2 rounded p-1 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            onClick={onToggleFullScreen}
          >
            {fullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>
      <div
        ref={container}
        role="img"
        aria-label={`${stock.symbol} candlestick chart`}
      />
      <p aria-live="polite" className="mt-1 truncate text-xs text-gray-500">
        {tooltip}
      </p>
    </section>
  );
}
