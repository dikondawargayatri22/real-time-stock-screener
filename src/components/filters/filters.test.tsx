import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FilterPanel } from './FilterPanel';
import {
  BooleanFilter,
  MultiSelectFilter,
  RangeFilter,
  SingleSelectFilter,
} from './FilterControls';
import { FilterConfig, Stock } from '../../types';

const stock = {
  id: '1',
  sector: 'Technology',
  peRatio: 12,
  rsi: 60,
  exchange: 'NASDAQ',
} as Stock;

describe('filter controls', () => {
  it('emits changes from primitive controls', () => {
    const onRange = vi.fn();
    render(
      <RangeFilter
        label="P/E"
        min={0}
        max={100}
        value={[0, 50]}
        onChange={onRange}
      />
    );
    fireEvent.change(screen.getByLabelText('P/E minimum'), {
      target: { value: '60' },
    });
    expect(onRange).toHaveBeenCalledWith([50, 50]);

    const onMulti = vi.fn();
    const onSingle = vi.fn();
    const onBoolean = vi.fn();
    render(
      <>
        <MultiSelectFilter
          label="Sector"
          options={['Technology', 'Energy']}
          value={[]}
          onChange={onMulti}
        />
        <SingleSelectFilter
          label="Exchange"
          options={[{ label: 'NASDAQ', value: 'NASDAQ' }]}
          value=""
          onChange={onSingle}
        />
        <BooleanFilter label="Dividend" checked={false} onChange={onBoolean} />
      </>
    );
    const sector = screen.getByLabelText('Sector') as HTMLSelectElement;
    sector.options[1].selected = true;
    fireEvent.change(sector);
    fireEvent.change(screen.getByLabelText('Exchange'), {
      target: { value: 'NASDAQ' },
    });
    fireEvent.click(screen.getByLabelText('Dividend'));
    expect(onMulti).toHaveBeenCalledWith(['Energy']);
    expect(onSingle).toHaveBeenCalledWith('NASDAQ');
    expect(onBoolean).toHaveBeenCalledWith(true);
  });
});

describe('filter panel', () => {
  it('applies, clears, removes, collapses, and expands filters', () => {
    const onChange = vi.fn();
    const active: FilterConfig[] = [
      {
        id: 'exchange',
        columnId: 'exchange',
        operator: 'equals',
        value: 'NASDAQ',
      },
    ];
    render(
      <FilterPanel stocks={[stock]} filters={active} onChange={onChange} />
    );
    expect(screen.getByText('matching stocks')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Collapse filters'));
    fireEvent.click(screen.getByLabelText('Expand filters'));
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove exchange filter' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Value' }));
    expect(onChange).toHaveBeenCalledWith([]);
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'value-pe' })])
    );
  });

  it('adds range, sector, exchange, and dividend filters', () => {
    const onChange = vi.fn();
    render(<FilterPanel stocks={[stock]} filters={[]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('P/E ratio minimum'), {
      target: { value: '5' },
    });
    const sectors = screen.getByLabelText('Sectors') as HTMLSelectElement;
    sectors.options[0].selected = true;
    fireEvent.change(sectors);
    fireEvent.change(screen.getByLabelText('Exchange'), {
      target: { value: 'NASDAQ' },
    });
    fireEvent.click(screen.getByLabelText('Has dividend'));
    expect(onChange).toHaveBeenCalled();
  });
});
