import { FilterConfig } from '@/types';

export const SCREENER_PRESETS: Record<string, FilterConfig[]> = {
  Value: [
    {
      id: 'value-pe',
      columnId: 'peRatio',
      operator: 'between',
      value: [0, 15],
    },
    {
      id: 'value-cap',
      columnId: 'marketCap',
      operator: 'greaterThan',
      value: 1_000_000_000,
    },
  ],
  Growth: [
    { id: 'growth-roe', columnId: 'roe', operator: 'greaterThan', value: 15 },
    {
      id: 'growth-margin',
      columnId: 'profitMargin',
      operator: 'greaterThan',
      value: 10,
    },
  ],
  'Technical Breakout': [
    {
      id: 'breakout-rsi',
      columnId: 'rsi',
      operator: 'between',
      value: [55, 75],
    },
    {
      id: 'breakout-change',
      columnId: 'changePercent',
      operator: 'greaterThan',
      value: 1,
    },
  ],
};
