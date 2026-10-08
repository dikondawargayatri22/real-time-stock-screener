import { describe, expect, it } from 'vitest';
import { bollingerBands, ema, rsi, sma, volumeProfile } from './indicators';
import { OHLCV } from '@/types';

const data = [1, 2, 3, 4, 5, 6].map((close, index): OHLCV => ({
  time: `2024-01-0${index + 1}`,
  open: close,
  high: close + 1,
  low: close - 1,
  close,
  volume: (index + 1) * 100,
}));

describe('technical indicators', () => {
  it('calculates SMA and EMA', () => {
    expect(sma(data, 3).map((point) => point.value)).toEqual([2, 3, 4, 5]);
    expect(ema(data, 3).map((point) => point.value)).toEqual([2, 3, 4, 5]);
  });
  it('calculates Bollinger bands and RSI', () => {
    const bands = bollingerBands(data, 3);
    expect(bands[0]).toMatchObject({ value: 2, upper: 3.633, lower: 0.367 });
    expect(rsi(data, 3).every((point) => point.value === 100)).toBe(true);
  });
  it('bins all volume into a volume profile', () => {
    expect(
      volumeProfile(data, 3).reduce((sum, bin) => sum + bin.volume, 0)
    ).toBe(2100);
  });
});
