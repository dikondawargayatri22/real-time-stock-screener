import { describe, expect, it } from 'vitest';
import { createFilterAst, createPredicate, filterStocks } from './filterEngine';
import { FilterConfig, Stock } from '@/types';

const stock = (overrides: Partial<Stock>): Stock => ({
  id: '1',
  symbol: 'AAA',
  name: 'Alpha',
  sector: 'Technology',
  industry: 'Software',
  price: 100,
  change: 1,
  changePercent: 1,
  volume: 10,
  avgVolume: 10,
  marketCap: 1_000_000_000,
  peRatio: 10,
  forwardPE: 10,
  beta: 1,
  dividendYield: 2,
  eps: 1,
  high52Week: 110,
  low52Week: 90,
  rsi: 60,
  macd: 1,
  sma20: 1,
  sma50: 1,
  sma200: 1,
  bollingerUpper: 1,
  bollingerLower: 1,
  debtToEquity: 1,
  currentRatio: 1,
  roe: 20,
  roa: 10,
  profitMargin: 15,
  operatingMargin: 15,
  exchange: 'NASDAQ',
  country: 'USA',
  employees: 1,
  founded: 2000,
  description: '',
  ...overrides,
});

describe('filter engine', () => {
  it('supports range, membership, and text predicates', () => {
    const filters: FilterConfig[] = [
      { id: 'pe', columnId: 'peRatio', operator: 'between', value: [5, 15] },
      {
        id: 'sector',
        columnId: 'sector',
        operator: 'in',
        value: ['Technology'],
      },
      { id: 'symbol', columnId: 'symbol', operator: 'contains', value: 'aa' },
    ];
    expect(
      filterStocks(
        [
          stock({}),
          stock({ id: '2', peRatio: 30 }),
          stock({ id: '3', sector: 'Energy' }),
        ],
        filters
      ).map((item) => item.id)
    ).toEqual(['1']);
  });

  it('orders predicates by selectivity and short-circuits', () => {
    const ast = createFilterAst([
      {
        id: 'contains',
        columnId: 'name',
        operator: 'contains',
        value: 'alpha',
      },
      { id: 'exact', columnId: 'exchange', operator: 'equals', value: 'NYSE' },
    ]);
    expect(
      ast.type === 'and' &&
        ast.children.map(
          (child) => child.type === 'predicate' && child.filter.id
        )
    ).toEqual(['exact', 'contains']);
    expect(createPredicate(ast)(stock({ exchange: 'NASDAQ' }))).toBe(false);
  });
});
