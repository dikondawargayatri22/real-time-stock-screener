import { OHLCV } from '@/types';

export interface TimedValue {
  time: string;
  value: number;
}
export interface BollingerPoint extends TimedValue {
  upper: number;
  lower: number;
}
export interface VolumeProfileBin {
  low: number;
  high: number;
  volume: number;
}

const rounded = (value: number) => Number(value.toFixed(4));

export function sma(data: OHLCV[], period: number): TimedValue[] {
  if (period <= 0) return [];
  return data.flatMap((bar, index) =>
    index < period - 1
      ? []
      : [
          {
            time: bar.time,
            value: rounded(
              data
                .slice(index - period + 1, index + 1)
                .reduce((sum, item) => sum + item.close, 0) / period
            ),
          },
        ]
  );
}

export function ema(data: OHLCV[], period: number): TimedValue[] {
  if (period <= 0 || data.length < period) return [];
  const multiplier = 2 / (period + 1);
  let previous =
    data.slice(0, period).reduce((sum, item) => sum + item.close, 0) / period;
  const result: TimedValue[] = [
    { time: data[period - 1].time, value: rounded(previous) },
  ];
  for (let index = period; index < data.length; index += 1) {
    previous = (data[index].close - previous) * multiplier + previous;
    result.push({ time: data[index].time, value: rounded(previous) });
  }
  return result;
}

export function bollingerBands(
  data: OHLCV[],
  period = 20,
  deviations = 2
): BollingerPoint[] {
  return data.flatMap((bar, index) => {
    if (index < period - 1) return [];
    const values = data
      .slice(index - period + 1, index + 1)
      .map((item) => item.close);
    const mean = values.reduce((sum, value) => sum + value, 0) / period;
    const deviation = Math.sqrt(
      values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / period
    );
    return [
      {
        time: bar.time,
        value: rounded(mean),
        upper: rounded(mean + deviations * deviation),
        lower: rounded(mean - deviations * deviation),
      },
    ];
  });
}

export function rsi(data: OHLCV[], period = 14): TimedValue[] {
  if (data.length <= period) return [];
  let gains = 0;
  let losses = 0;
  for (let index = 1; index <= period; index += 1) {
    const change = data[index].close - data[index - 1].close;
    gains += Math.max(change, 0);
    losses += Math.max(-change, 0);
  }
  gains /= period;
  losses /= period;
  const output: TimedValue[] = [
    {
      time: data[period].time,
      value: rounded(losses === 0 ? 100 : 100 - 100 / (1 + gains / losses)),
    },
  ];
  for (let index = period + 1; index < data.length; index += 1) {
    const change = data[index].close - data[index - 1].close;
    gains = (gains * (period - 1) + Math.max(change, 0)) / period;
    losses = (losses * (period - 1) + Math.max(-change, 0)) / period;
    output.push({
      time: data[index].time,
      value: rounded(losses === 0 ? 100 : 100 - 100 / (1 + gains / losses)),
    });
  }
  return output;
}

export function volumeProfile(data: OHLCV[], bins = 12): VolumeProfileBin[] {
  if (!data.length || bins <= 0) return [];
  const low = Math.min(...data.map((bar) => bar.low));
  const high = Math.max(...data.map((bar) => bar.high));
  const size = (high - low) / bins || 1;
  const output = Array.from({ length: bins }, (_, index) => ({
    low: low + index * size,
    high: low + (index + 1) * size,
    volume: 0,
  }));
  data.forEach((bar) => {
    const index = Math.min(
      bins - 1,
      Math.max(0, Math.floor((bar.close - low) / size))
    );
    output[index].volume += bar.volume;
  });
  return output;
}
