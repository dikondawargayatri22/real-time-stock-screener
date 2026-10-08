import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StockTable } from '.';
import { ChangeCell, MarketCapCell, PriceCell, VolumeCell } from './cells';
import { Stock } from '../../types';

const stock: Stock = {
  id: '1',
  symbol: 'ACME',
  name: 'Acme Corp',
  sector: 'Technology',
  industry: 'Software',
  price: 123.4,
  change: 2.5,
  changePercent: 2.1,
  volume: 1_250_000,
  avgVolume: 1_000_000,
  marketCap: 2_500_000_000,
  peRatio: 20,
  forwardPE: 18,
  beta: 1.1,
  dividendYield: null,
  eps: 4,
  high52Week: 130,
  low52Week: 80,
  rsi: 55,
  macd: 1,
  sma20: 100,
  sma50: 95,
  sma200: 90,
  bollingerUpper: 120,
  bollingerLower: 80,
  debtToEquity: null,
  currentRatio: null,
  roe: null,
  roa: null,
  profitMargin: null,
  operatingMargin: null,
  exchange: 'NYSE',
  country: 'US',
  employees: null,
  founded: null,
  description: 'Test stock',
};

describe('stock grid', () => {
  it('formats specialized cells', () => {
    const { rerender } = render(
      <>
        <PriceCell value={12.5} />
        <ChangeCell value={-1.25} />
        <VolumeCell value={1250000} />
        <MarketCapCell value={2500000000} />
      </>
    );
    expect(screen.getByText('$12.50')).toBeTruthy();
    expect(screen.getByText('-1.25').className).toContain('text-red-600');
    expect(screen.getByText('1,250,000')).toBeTruthy();
    expect(screen.getByText('$2.50B')).toBeTruthy();
    rerender(<ChangeCell value={1.25} percent />);
    expect(screen.getByText('+1.25%').className).toContain('text-emerald-600');
  });

  it('exposes grid semantics and selects with keyboard', () => {
    render(
      <StockTable data={[stock, { ...stock, id: '2', symbol: 'BETA' }]} />
    );
    const grid = screen.getByRole('grid');
    expect(grid.getAttribute('aria-rowcount')).toBe('2');
    const firstCell = document.querySelector<HTMLElement>(
      '[data-grid-cell="0-0"]'
    )!;
    firstCell.focus();
    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('data-grid-cell')).toBe('0-1');
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    fireEvent.keyDown(grid, { key: 'Enter' });
    expect(
      screen.getByText(
        '1 stocks selected. Use arrow keys to move; Enter or Space selects a stock.'
      )
    ).toBeTruthy();
  });

  it('virtualizes a large result set', () => {
    render(
      <StockTable
        data={Array.from({ length: 500 }, (_, index) => ({
          ...stock,
          id: String(index),
          symbol: `S${index}`,
        }))}
      />
    );
    expect(screen.getByRole('grid').getAttribute('aria-rowcount')).toBe('500');
    expect(document.querySelectorAll('[role="row"]').length).toBeLessThan(100);
  });
});
