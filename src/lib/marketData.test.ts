import { describe, expect, it, vi } from 'vitest';
import { fetchMarketStocks } from './marketData';

const response = (body: unknown, ok = true) => ({ ok, json: async () => body });

describe('market data adapter', () => {
  it('maps live quote and chart responses into screener stocks', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          quoteResponse: {
            result: [
              {
                symbol: 'AAPL',
                marketCap: 3_000_000_000_000,
                trailingPE: 30,
                beta: 1.2,
                dividendYield: 0.005,
                fiftyTwoWeekHigh: 220,
                fiftyTwoWeekLow: 150,
                averageDailyVolume3Month: 80_000_000,
              },
            ],
          },
        })
      )
      .mockResolvedValue(
        response({
          chart: {
            result: [
              {
                meta: {
                  regularMarketPrice: 200,
                  previousClose: 198,
                  longName: 'Apple Inc.',
                  exchangeName: 'NMS',
                },
                indicators: {
                  quote: [
                    {
                      close: [190, 198, 200],
                      volume: [1_000_000, 2_000_000, 3_000_000],
                    },
                  ],
                },
              },
            ],
          },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const stocks = await fetchMarketStocks(['AAPL']);
    expect(stocks[0]).toMatchObject({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 200,
      change: 2,
      marketCap: 3_000_000_000_000,
      peRatio: 30,
      exchange: 'NMS',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it('continues without quote fundamentals and rejects when every chart fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({}, false)));
    await expect(fetchMarketStocks(['AAPL'])).rejects.toThrow(
      'Market data provider returned no stocks'
    );
    vi.unstubAllGlobals();
  });
});
