import { Stock } from '../types';

export const MARKET_SYMBOLS = [
  'AAPL',
  'MSFT',
  'NVDA',
  'AMZN',
  'META',
  'GOOGL',
  'TSLA',
  'AVGO',
  'JPM',
  'V',
  'WMT',
  'LLY',
  'XOM',
  'JNJ',
  'MA',
  'ORCL',
  'COST',
  'HD',
  'PG',
  'NFLX',
  'AMD',
  'CRM',
  'BAC',
  'KO',
  'PEP',
  'DIS',
  'ADBE',
  'TMO',
  'CSCO',
  'MCD',
];

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: Record<string, unknown>;
      indicators?: { quote?: Array<Record<string, Array<number | null>>> };
    }>;
  };
};
type YahooQuote = {
  symbol?: string;
  marketCap?: number;
  trailingPE?: number;
  beta?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  averageDailyVolume3Month?: number;
};

const toNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

async function fetchChart(symbol: string) {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'real-time-stock-screener/1.0',
      },
      next: { revalidate: 60 },
    }
  );
  if (!response.ok) throw new Error(`Market data request failed for ${symbol}`);
  const payload = (await response.json()) as YahooChart;
  const result = payload.chart?.result?.[0];
  if (!result?.meta) throw new Error(`No market data returned for ${symbol}`);
  return result;
}

function mapStock(
  symbol: string,
  chart: NonNullable<NonNullable<YahooChart['chart']>['result']>[number],
  quote?: YahooQuote
): Stock {
  const meta = chart.meta ?? {};
  const values = chart.indicators?.quote?.[0] ?? {};
  const closes = (values.close ?? []).filter(
    (value): value is number => typeof value === 'number'
  );
  const volumes = (values.volume ?? []).filter(
    (value): value is number => typeof value === 'number'
  );
  const price = toNumber(meta.regularMarketPrice, closes.at(-1));
  const previousClose = toNumber(
    meta.previousClose,
    toNumber(meta.chartPreviousClose, closes.at(-2) ?? price)
  );
  const change = price - previousClose;
  return {
    id: `market_${symbol}`,
    symbol,
    name: String(meta.longName ?? meta.shortName ?? symbol),
    sector: 'US Equities',
    industry: String(meta.instrumentType ?? 'Equity'),
    price,
    change,
    changePercent: previousClose ? (change / previousClose) * 100 : 0,
    volume: toNumber(meta.regularMarketVolume, volumes.at(-1)),
    avgVolume: toNumber(
      quote?.averageDailyVolume3Month,
      volumes.length
        ? volumes.reduce((sum, value) => sum + value, 0) / volumes.length
        : 0
    ),
    marketCap: toNumber(quote?.marketCap),
    peRatio: quote?.trailingPE ?? null,
    forwardPE: null,
    beta: toNumber(quote?.beta, 1),
    dividendYield: quote?.dividendYield ? quote.dividendYield * 100 : null,
    eps: null,
    high52Week: toNumber(quote?.fiftyTwoWeekHigh, Math.max(...closes, price)),
    low52Week: toNumber(quote?.fiftyTwoWeekLow, Math.min(...closes, price)),
    rsi: 50,
    macd: 0,
    sma20: price,
    sma50: price,
    sma200: price,
    bollingerUpper: price,
    bollingerLower: price,
    debtToEquity: null,
    currentRatio: null,
    roe: null,
    roa: null,
    profitMargin: null,
    operatingMargin: null,
    exchange: String(meta.exchangeName ?? 'US'),
    country: 'United States',
    employees: null,
    founded: null,
    description: `${symbol} live market data from Yahoo Finance.`,
  };
}

export async function fetchMarketStocks(
  symbols: string[] = MARKET_SYMBOLS
): Promise<Stock[]> {
  let quotes = new Map<string, YahooQuote>();
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'real-time-stock-screener/1.0',
        },
        next: { revalidate: 60 },
      }
    );
    if (response.ok) {
      const payload = (await response.json()) as {
        quoteResponse?: { result?: YahooQuote[] };
      };
      quotes = new Map(
        (payload.quoteResponse?.result ?? []).map((quote) => [
          quote.symbol ?? '',
          quote,
        ])
      );
    }
  } catch {
    /* Chart data remains sufficient if quote fundamentals are unavailable. */
  }
  const stocks = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        return mapStock(symbol, await fetchChart(symbol), quotes.get(symbol));
      } catch {
        return null;
      }
    })
  );
  const result = stocks.filter((stock): stock is Stock => stock !== null);
  if (!result.length)
    throw new Error('Market data provider returned no stocks');
  return result;
}
