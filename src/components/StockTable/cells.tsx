import clsx from 'clsx';
import { memo, useEffect, useRef, useState } from 'react';

function usePriceFlash(value: number) {
  const previous = useRef(value);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (previous.current !== value) {
      setDirection(value > previous.current ? 'up' : 'down');
      previous.current = value;
      setRevision((current) => current + 1);
    }
  }, [value]);
  return { direction, revision };
}

export const PriceCell = memo(function PriceCell({ value }: { value: number }) {
  const { direction, revision } = usePriceFlash(value);
  return (
    <span
      key={revision}
      className={clsx(
        direction === 'up' && 'price-flash-up',
        direction === 'down' && 'price-flash-down'
      )}
    >
      ${value.toFixed(2)}
    </span>
  );
});

export const ChangeCell = memo(function ChangeCell({
  value,
  percent = false,
}: {
  value: number;
  percent?: boolean;
}) {
  const { direction, revision } = usePriceFlash(value);
  const formatted = `${value > 0 ? '+' : ''}${value.toFixed(2)}${percent ? '%' : ''}`;
  return (
    <span
      key={revision}
      className={clsx(
        value > 0 && 'text-emerald-600',
        value < 0 && 'text-red-600',
        direction === 'up' && 'price-flash-up',
        direction === 'down' && 'price-flash-down'
      )}
    >
      {formatted}
    </span>
  );
});

export const VolumeCell = memo(function VolumeCell({
  value,
}: {
  value: number;
}) {
  return <span>{value.toLocaleString()}</span>;
});

export const MarketCapCell = memo(function MarketCapCell({
  value,
}: {
  value: number;
}) {
  if (value >= 1_000_000_000_000)
    return <span>${(value / 1_000_000_000_000).toFixed(2)}T</span>;
  if (value >= 1_000_000_000)
    return <span>${(value / 1_000_000_000).toFixed(2)}B</span>;
  if (value >= 1_000_000)
    return <span>${(value / 1_000_000).toFixed(2)}M</span>;
  return <span>${value.toLocaleString()}</span>;
});
