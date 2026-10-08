import { describe, expect, it } from 'vitest';
import { createChartData, TIMEFRAMES } from './chartData';
import { Stock } from '../types';

const stock = {
  price: 100,
  changePercent: 2,
  beta: 1.1,
  symbol: 'ACME',
  avgVolume: 1_000_000,
} as Stock;

describe('chart data', () => {
  it('creates ordered OHLCV bars for every supported timeframe', () => {
    for (const timeframe of TIMEFRAMES) {
      const bars = createChartData(stock, timeframe);
      expect(bars.length).toBeGreaterThan(0);
      expect(bars[0].time <= bars.at(-1)!.time).toBe(true);
      expect(
        bars.every((bar) => bar.high >= Math.max(bar.open, bar.close))
      ).toBe(true);
      expect(
        bars.every((bar) => bar.low <= Math.min(bar.open, bar.close))
      ).toBe(true);
      expect(bars.every((bar) => bar.volume > 0)).toBe(true);
    }
  });

  it('falls back to the one-month range for unknown timeframes', () => {
    expect(createChartData(stock, 'unknown')).toHaveLength(180);
  });
});
