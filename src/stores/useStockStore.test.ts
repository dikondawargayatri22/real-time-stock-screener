import { beforeEach, describe, expect, it } from 'vitest';
import { useStockStore } from './useStockStore';
import { FilterConfig, Stock } from '../types';

const stock = { id: '1', price: 100, change: 5, changePercent: 5 } as Stock;
const filter: FilterConfig = {
  id: 'pe',
  columnId: 'peRatio',
  operator: 'lessThan',
  value: 20,
};

describe('stock store', () => {
  beforeEach(() =>
    useStockStore.setState({
      stocks: [],
      filters: [],
      sorting: null,
      selectedStockIds: new Set(),
    })
  );

  it('manages stocks, filters, sorting, and selection', () => {
    const store = useStockStore.getState();
    store.setStocks([stock]);
    store.addFilter(filter);
    store.setSorting('price', true);
    store.toggleSelection('1');
    expect(useStockStore.getState().stocks).toEqual([stock]);
    expect(useStockStore.getState().filters).toEqual([filter]);
    expect(useStockStore.getState().sorting).toEqual({
      columnId: 'price',
      desc: true,
    });
    expect(useStockStore.getState().selectedStockIds.has('1')).toBe(true);

    useStockStore.getState().removeFilter('pe');
    useStockStore.getState().toggleSelection('1');
    useStockStore.getState().selectAll(['1', '2']);
    expect(useStockStore.getState().filters).toEqual([]);
    expect(Array.from(useStockStore.getState().selectedStockIds)).toEqual([
      '1',
      '2',
    ]);
    useStockStore.getState().clearSelection();
    useStockStore.getState().clearFilters();
    expect(useStockStore.getState().selectedStockIds.size).toBe(0);
  });

  it('updates only prices present in a tick and recalculates changes', () => {
    useStockStore.getState().setStocks([stock, { ...stock, id: '2' }]);
    useStockStore.getState().updatePrices({ '1': 110 });
    const [updated, unchanged] = useStockStore.getState().stocks;
    expect(updated).toMatchObject({
      price: 110,
      change: 15,
      changePercent: 15.789473684210526,
    });
    expect(unchanged).toEqual({ ...stock, id: '2' });
  });
});
