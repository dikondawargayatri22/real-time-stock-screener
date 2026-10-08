export interface OHLCV {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number | null;
  forwardPE: number | null;
  beta: number;
  dividendYield: number | null;
  eps: number | null;
  high52Week: number;
  low52Week: number;
  rsi: number;
  macd: number;
  sma20: number;
  sma50: number;
  sma200: number;
  bollingerUpper: number;
  bollingerLower: number;
  debtToEquity: number | null;
  currentRatio: number | null;
  roe: number | null;
  roa: number | null;
  profitMargin: number | null;
  operatingMargin: number | null;
  exchange: string;
  country: string;
  employees: number | null;
  founded: number | null;
  description: string;
}

export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'in'
  | 'isTrue'
  | 'isFalse';

export interface FilterConfig {
  id: string;
  columnId: keyof Stock;
  operator: FilterOperator;
  value: unknown;
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    totalRowCount: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}
