import { OHLCV, Stock } from '@/types';

const POINTS: Record<string, number> = {
  '1D': 78,
  '5D': 120,
  '1M': 180,
  '6M': 180,
  '1Y': 252,
  '5Y': 260,
};
export const TIMEFRAMES = Object.keys(POINTS);

export function createChartData(stock: Stock, timeframe: string): OHLCV[] {
  const count = POINTS[timeframe] ?? POINTS['1M'];
  const daysPerBar = timeframe === '5Y' ? 7 : 1;
  let close = stock.price * (1 - stock.changePercent / 100);
  const result: OHLCV[] = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    const drift =
      Math.sin(index * 1.7 + stock.symbol.length) * stock.beta * 0.012;
    const open = close;
    close = Math.max(1, open * (1 + drift));
    const high = Math.max(open, close) * 1.012;
    const low = Math.min(open, close) * 0.988;
    const date = new Date();
    date.setDate(date.getDate() - index * daysPerBar);
    result.push({
      time: date.toISOString().slice(0, 10),
      open,
      high,
      low,
      close,
      volume: Math.round(stock.avgVolume * (0.7 + Math.abs(drift) * 20)),
    });
  }
  return result;
}
