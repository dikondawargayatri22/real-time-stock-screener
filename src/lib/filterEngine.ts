import { FilterConfig, FilterOperator, Stock } from '@/types';

export type FilterAst =
  | { type: 'predicate'; filter: FilterConfig; selectivity: number }
  | { type: 'and'; children: FilterAst[] };

export type StockPredicate = (stock: Stock) => boolean;

const DEFAULT_SELECTIVITY: Record<FilterOperator, number> = {
  equals: 0.1,
  in: 0.2,
  between: 0.3,
  greaterThan: 0.5,
  lessThan: 0.5,
  contains: 0.65,
  isTrue: 0.5,
  isFalse: 0.5,
};

function matches(value: unknown, filter: FilterConfig): boolean {
  if (value === null || value === undefined) return false;
  switch (filter.operator) {
    case 'equals':
      return value === filter.value;
    case 'contains':
      return String(value)
        .toLowerCase()
        .includes(String(filter.value).toLowerCase());
    case 'greaterThan':
      return Number(value) > Number(filter.value);
    case 'lessThan':
      return Number(value) < Number(filter.value);
    case 'between': {
      const [min, max] = filter.value as [number, number];
      return Number(value) >= min && Number(value) <= max;
    }
    case 'in':
      return (filter.value as unknown[]).includes(value);
    case 'isTrue':
      return value === true;
    case 'isFalse':
      return value === false;
  }
}

export function createFilterAst(filters: FilterConfig[]): FilterAst {
  const children = filters
    .map((filter) => ({
      type: 'predicate' as const,
      filter,
      selectivity: DEFAULT_SELECTIVITY[filter.operator],
    }))
    .sort((a, b) => a.selectivity - b.selectivity);
  return { type: 'and', children };
}

export function createPredicate(ast: FilterAst): StockPredicate {
  if (ast.type === 'predicate')
    return (stock) => matches(stock[ast.filter.columnId], ast.filter);
  const predicates = ast.children.map(createPredicate);
  return (stock) => {
    for (const predicate of predicates) if (!predicate(stock)) return false;
    return true;
  };
}

export function filterStocks(
  stocks: Stock[],
  filters: FilterConfig[]
): Stock[] {
  if (!filters.length) return stocks;
  const predicate = createPredicate(createFilterAst(filters));
  return stocks.filter(predicate);
}
