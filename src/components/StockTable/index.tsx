'use client';

import {
  CSSProperties,
  KeyboardEvent,
  memo,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ColumnDef,
  ColumnPinningState,
  ColumnSizingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Stock } from '../../types';
import { ChangeCell, MarketCapCell, PriceCell, VolumeCell } from './cells';

const ROW_HEIGHT = 36;
const OVERSCAN = 12;

export const StockTable = memo(function StockTable({
  data,
  onRowClick,
}: {
  data: Stock[];
  onRowClick?: (stock: Stock) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [activeCell, setActiveCell] = useState({ row: 0, column: 0 });
  const columnPinning: ColumnPinningState = { left: ['select', 'symbol'] };
  const toggleSelection = (id: string) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const columns = useMemo<ColumnDef<Stock>[]>(
    () => [
      {
        id: 'select',
        header: () => 'Select',
        size: 52,
        minSize: 52,
        maxSize: 52,
        enableSorting: false,
        cell: ({ row }) => (
          <input
            aria-label={`Select ${row.original.symbol}`}
            type="checkbox"
            checked={selectedIds.has(row.original.id)}
            onChange={() => toggleSelection(row.original.id)}
            onClick={(event) => event.stopPropagation()}
          />
        ),
      },
      {
        accessorKey: 'symbol',
        header: 'Symbol',
        size: 110,
        minSize: 80,
        cell: (info) => <strong>{info.getValue() as string}</strong>,
      },
      { accessorKey: 'name', header: 'Name', size: 200, minSize: 120 },
      { accessorKey: 'sector', header: 'Sector', size: 140, minSize: 100 },
      { accessorKey: 'industry', header: 'Industry', size: 170, minSize: 110 },
      {
        accessorKey: 'price',
        header: 'Price',
        size: 105,
        cell: (info) => <PriceCell value={info.getValue() as number} />,
      },
      {
        accessorKey: 'change',
        header: 'Change',
        size: 105,
        cell: (info) => <ChangeCell value={info.getValue() as number} />,
      },
      {
        accessorKey: 'changePercent',
        header: 'Change %',
        size: 105,
        cell: (info) => (
          <ChangeCell value={info.getValue() as number} percent />
        ),
      },
      {
        accessorKey: 'volume',
        header: 'Volume',
        size: 120,
        cell: (info) => <VolumeCell value={info.getValue() as number} />,
      },
      {
        accessorKey: 'avgVolume',
        header: 'Avg. volume',
        size: 130,
        cell: (info) => <VolumeCell value={info.getValue() as number} />,
      },
      {
        accessorKey: 'marketCap',
        header: 'Market cap',
        size: 125,
        cell: (info) => <MarketCapCell value={info.getValue() as number} />,
      },
      {
        accessorKey: 'peRatio',
        header: 'P/E',
        size: 85,
        cell: (info) => (info.getValue() as number | null)?.toFixed(2) ?? '—',
      },
      {
        accessorKey: 'beta',
        header: 'Beta',
        size: 85,
        cell: (info) => (info.getValue() as number).toFixed(2),
      },
      {
        accessorKey: 'high52Week',
        header: '52W high',
        size: 110,
        cell: (info) => <PriceCell value={info.getValue() as number} />,
      },
      {
        accessorKey: 'low52Week',
        header: '52W low',
        size: 110,
        cell: (info) => <PriceCell value={info.getValue() as number} />,
      },
    ],
    [selectedIds]
  );
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnSizing, columnPinning },
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: 'onChange',
  });
  const rows = table.getRowModel().rows;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
    initialRect: { width: 0, height: 500 },
  });
  // A small first render fallback avoids an empty grid before the scroll
  // container has been measured (notably during hydration and in jsdom).
  const virtualItems = virtualizer.getVirtualItems();
  const renderedItems = virtualItems.length
    ? virtualItems
    : rows
        .slice(0, Math.ceil(500 / ROW_HEIGHT) + OVERSCAN)
        .map((_, index) => ({ index, start: index * ROW_HEIGHT }));
  const visibleColumns = table.getVisibleLeafColumns();
  const pinnedStyle = (id: string, header = false): CSSProperties =>
    id === 'select'
      ? {
          position: 'sticky',
          left: 0,
          zIndex: header ? 4 : 2,
          background: header ? '#f9fafb' : 'white',
        }
      : id === 'symbol'
        ? {
            position: 'sticky',
            left: table.getColumn('select')?.getSize() ?? 52,
            zIndex: header ? 4 : 2,
            background: header ? '#f9fafb' : 'white',
            boxShadow: '2px 0 3px rgb(0 0 0 / 0.06)',
          }
        : {};
  const focusCell = (row: number, column: number) => {
    setActiveCell({ row, column });
    virtualizer.scrollToIndex(row, { align: 'auto' });
    const selector = `[data-grid-cell="${row}-${column}"]`;
    document.querySelector<HTMLElement>(selector)?.focus();
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(selector)?.focus()
    );
  };
  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const pageSize = Math.max(
      1,
      Math.floor((parentRef.current?.clientHeight ?? ROW_HEIGHT) / ROW_HEIGHT)
    );
    let row = activeCell.row;
    let column = activeCell.column;
    if (event.key === 'ArrowDown') row += 1;
    else if (event.key === 'ArrowUp') row -= 1;
    else if (event.key === 'ArrowRight') column += 1;
    else if (event.key === 'ArrowLeft') column -= 1;
    else if (event.key === 'PageDown') row += pageSize;
    else if (event.key === 'PageUp') row -= pageSize;
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (rows[activeCell.row])
        toggleSelection(rows[activeCell.row].original.id);
      return;
    } else return;
    event.preventDefault();
    focusCell(
      Math.max(0, Math.min(rows.length - 1, row)),
      Math.max(0, Math.min(visibleColumns.length - 1, column))
    );
  };
  return (
    <div className="h-full rounded-md border border-gray-200 bg-white shadow-sm">
      <div
        ref={parentRef}
        className="h-full max-h-[calc(90vh-7rem)] overflow-auto"
        role="grid"
        aria-label="Stock screener results"
        aria-rowcount={rows.length}
        aria-colcount={visibleColumns.length}
        onKeyDown={onGridKeyDown}
      >
        <div
          role="row"
          className="sticky top-0 z-10 flex min-w-max border-b border-gray-200 bg-gray-50"
        >
          {table.getHeaderGroups()[0]?.headers.map((header) => (
            <div
              key={header.id}
              role="columnheader"
              aria-sort={
                header.column.getIsSorted() === 'asc'
                  ? 'ascending'
                  : header.column.getIsSorted() === 'desc'
                    ? 'descending'
                    : 'none'
              }
              className="relative flex h-10 shrink-0 items-center border-r border-gray-200 px-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
              style={{
                width: header.getSize(),
                ...pinnedStyle(header.column.id, true),
              }}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-1 truncate text-left"
                onClick={header.column.getToggleSortingHandler()}
                disabled={!header.column.getCanSort()}
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
                {header.column.getIsSorted() === 'asc' ? (
                  <ArrowUp size={14} />
                ) : header.column.getIsSorted() === 'desc' ? (
                  <ArrowDown size={14} />
                ) : header.column.getCanSort() ? (
                  <ArrowUpDown size={14} className="text-gray-400" />
                ) : null}
              </button>
              {header.column.getCanResize() && (
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label={`Resize ${header.column.id} column`}
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
                  onDoubleClick={() => header.column.resetSize()}
                  onMouseDown={header.getResizeHandler()}
                  onTouchStart={header.getResizeHandler()}
                />
              )}
            </div>
          ))}
        </div>
        <div
          style={{
            height: virtualizer.getTotalSize(),
            position: 'relative',
            minWidth: table.getTotalSize(),
          }}
        >
          {renderedItems.map((item) => {
            const row = rows[item.index];
            return (
              <div
                key={row.id}
                role="row"
                aria-rowindex={item.index + 2}
                onClick={() => onRowClick?.(row.original)}
                className="absolute left-0 flex min-w-max border-b border-gray-100 hover:bg-gray-50"
                style={{
                  height: ROW_HEIGHT,
                  transform: `translateY(${item.start}px)`,
                }}
              >
                {row.getVisibleCells().map((cell, index) => (
                  <div
                    key={cell.id}
                    role="gridcell"
                    data-grid-cell={`${item.index}-${index}`}
                    tabIndex={
                      activeCell.row === item.index &&
                      activeCell.column === index
                        ? 0
                        : -1
                    }
                    onFocus={() =>
                      setActiveCell({ row: item.index, column: index })
                    }
                    onClick={() => focusCell(item.index, index)}
                    className="shrink-0 truncate border-r border-gray-100 px-3 leading-9 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    style={{
                      width: cell.column.getSize(),
                      ...pinnedStyle(cell.column.id),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {selectedIds.size} stocks selected. Use arrow keys to move; Enter or
        Space selects a stock.
      </p>
    </div>
  );
});
