'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { FilterConfig, Stock } from '@/types';
import {
  BooleanFilter,
  MultiSelectFilter,
  RangeFilter,
  SingleSelectFilter,
} from './FilterControls';
import { SCREENER_PRESETS } from './presets';

const upsert = (filters: FilterConfig[], filter: FilterConfig) => [
  ...filters.filter((item) => item.id !== filter.id),
  filter,
];
const remove = (filters: FilterConfig[], id: string) =>
  filters.filter((item) => item.id !== id);

export const FilterPanel = memo(function FilterPanel({
  stocks,
  filters,
  onChange,
}: {
  stocks: Stock[];
  filters: FilterConfig[];
  onChange: (filters: FilterConfig[]) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const sectors = useMemo(
    () => Array.from(new Set(stocks.map((stock) => stock.sector))).sort(),
    [stocks]
  );
  const range = (id: string, fallback: [number, number]): [number, number] =>
    (filters.find((filter) => filter.id === id)?.value as [number, number]) ??
    fallback;
  const sectorsValue =
    (filters.find((filter) => filter.id === 'sector')?.value as string[]) ?? [];
  const hasDividend = filters.some((filter) => filter.id === 'dividend');
  if (collapsed)
    return (
      <aside className="flex w-full shrink-0 justify-center border-b border-gray-200 bg-white py-2 lg:w-10 lg:border-r lg:border-b-0 lg:pt-3">
        <button
          type="button"
          className="rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          aria-label="Expand filters"
          onClick={() => setCollapsed(false)}
        >
          <ChevronRight size={18} />
        </button>
      </aside>
    );
  const setRange = (
    id: string,
    columnId: keyof Stock,
    value: [number, number]
  ) => onChange(upsert(filters, { id, columnId, operator: 'between', value }));
  return (
    <aside
      className="w-full shrink-0 overflow-y-auto border-b border-gray-200 bg-white p-4 lg:w-72 lg:border-r lg:border-b-0"
      aria-label="Stock filters"
    >
      <div className="mb-5 flex items-center">
        <h2 className="font-semibold text-gray-900">Filters</h2>
        <button
          type="button"
          className="ml-auto rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          aria-label="Collapse filters"
          onClick={() => setCollapsed(true)}
        >
          <ChevronLeft size={18} />
        </button>
      </div>
      <div className="mb-5 rounded bg-blue-50 p-3 text-sm text-blue-800">
        <strong>{stocks.length.toLocaleString()}</strong> matching stocks
      </div>
      <div className="space-y-5">
        <RangeFilter
          label="P/E ratio"
          min={0}
          max={100}
          value={range('pe', [0, 100])}
          onChange={(value) => setRange('pe', 'peRatio', value)}
        />
        <RangeFilter
          label="RSI (14)"
          min={0}
          max={100}
          value={range('rsi', [0, 100])}
          onChange={(value) => setRange('rsi', 'rsi', value)}
        />
        <MultiSelectFilter
          label="Sectors"
          options={sectors}
          value={sectorsValue}
          onChange={(value) =>
            onChange(
              value.length
                ? upsert(filters, {
                    id: 'sector',
                    columnId: 'sector',
                    operator: 'in',
                    value,
                  })
                : remove(filters, 'sector')
            )
          }
        />
        <SingleSelectFilter
          label="Exchange"
          value={
            (filters.find((filter) => filter.id === 'exchange')
              ?.value as string) ?? ''
          }
          options={[
            { label: 'All exchanges', value: '' },
            { label: 'NASDAQ', value: 'NASDAQ' },
            { label: 'NYSE', value: 'NYSE' },
          ]}
          onChange={(value) =>
            onChange(
              value
                ? upsert(filters, {
                    id: 'exchange',
                    columnId: 'exchange',
                    operator: 'equals',
                    value,
                  })
                : remove(filters, 'exchange')
            )
          }
        />
        <BooleanFilter
          label="Has dividend"
          checked={hasDividend}
          onChange={(checked) =>
            onChange(
              checked
                ? upsert(filters, {
                    id: 'dividend',
                    columnId: 'dividendYield',
                    operator: 'greaterThan',
                    value: 0,
                  })
                : remove(filters, 'dividend')
            )
          }
        />
      </div>
      <div className="mt-6 border-t pt-4">
        <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
          Saved screeners
        </p>
        {Object.entries(SCREENER_PRESETS).map(([name, preset]) => (
          <button
            type="button"
            key={name}
            className="mb-1 block w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            onClick={() => onChange(preset)}
          >
            {name}
          </button>
        ))}
      </div>
      {filters.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <div className="mb-2 flex items-center">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Active filters
            </p>
            <button
              type="button"
              className="ml-auto rounded text-xs text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              onClick={() => onChange([])}
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {filters.map((filter) => (
              <span
                key={filter.id}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs"
              >
                {String(filter.columnId)}{' '}
                <button
                  type="button"
                  className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                  aria-label={`Remove ${filter.columnId} filter`}
                  onClick={() => onChange(remove(filters, filter.id))}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
});
