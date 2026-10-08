import { create } from 'zustand';
import { Stock, FilterConfig } from '../types';

interface StockState {
  // Data
  stocks: Stock[];
  setStocks: (stocks: Stock[]) => void;

  // Filters
  filters: FilterConfig[];
  setFilters: (filters: FilterConfig[]) => void;
  addFilter: (filter: FilterConfig) => void;
  removeFilter: (id: string) => void;
  clearFilters: () => void;

  // Sorting
  sorting: { columnId: keyof Stock; desc: boolean } | null;
  setSorting: (columnId: keyof Stock, desc: boolean) => void;

  // Selection
  selectedStockIds: Set<string>;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;

  // Real-time Prices
  updatePrices: (updates: Record<string, number>) => void;
}

export const useStockStore = create<StockState>((set) => ({
  // Data
  stocks: [],
  setStocks: (stocks) => set({ stocks }),

  // Filters
  filters: [],
  setFilters: (filters) => set({ filters }),
  addFilter: (filter) =>
    set((state) => ({ filters: [...state.filters, filter] })),
  removeFilter: (id) =>
    set((state) => ({ filters: state.filters.filter((f) => f.id !== id) })),
  clearFilters: () => set({ filters: [] }),

  // Sorting
  sorting: null,
  setSorting: (columnId, desc) => set({ sorting: { columnId, desc } }),

  // Selection
  selectedStockIds: new Set<string>(),
  toggleSelection: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedStockIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedStockIds: newSelection };
    }),
  clearSelection: () => set({ selectedStockIds: new Set() }),
  selectAll: (ids) => set({ selectedStockIds: new Set(ids) }),

  // Real-time Prices
  updatePrices: (updates) =>
    set((state) => ({
      stocks: state.stocks.map((stock) => {
        const newPrice = updates[stock.id];
        if (newPrice !== undefined) {
          const previousClose = stock.price - stock.change;
          const newChange = newPrice - previousClose;
          const newChangePercent = (newChange / previousClose) * 100;
          return {
            ...stock,
            price: newPrice,
            change: newChange,
            changePercent: newChangePercent,
          };
        }
        return stock;
      }),
    })),
}));
