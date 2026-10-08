import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchMarketStocks } from '../../lib/marketData';

export default async function handler(
  _request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const stocks = await fetchMarketStocks();
    response.setHeader(
      'Cache-Control',
      's-maxage=60, stale-while-revalidate=300'
    );
    return response
      .status(200)
      .json({ data: stocks, updatedAt: new Date().toISOString() });
  } catch (error) {
    return response
      .status(502)
      .json({
        error:
          error instanceof Error ? error.message : 'Market data unavailable',
      });
  }
}
