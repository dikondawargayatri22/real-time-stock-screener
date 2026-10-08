'use client';

export function RangeFilter({
  label,
  min,
  max,
  value,
  step = 1,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: [number, number];
  step?: number;
  onChange: (value: [number, number]) => void;
}) {
  const update = (index: 0 | 1, next: number) => {
    const values: [number, number] =
      index === 0
        ? [Math.min(next, value[1]), value[1]]
        : [value[0], Math.max(next, value[0])];
    onChange(values);
  };
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-700">{label}</legend>
      <div className="flex gap-2 text-xs text-gray-500">
        <span>{value[0].toLocaleString()}</span>
        <span className="ml-auto">{value[1].toLocaleString()}</span>
      </div>
      <div className="relative h-5">
        <input
          aria-label={`${label} minimum`}
          className="absolute w-full accent-blue-600"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(event) => update(0, Number(event.target.value))}
        />
        <input
          aria-label={`${label} maximum`}
          className="absolute w-full accent-blue-600"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(event) => update(1, Number(event.target.value))}
        />
      </div>
    </fieldset>
  );
}

export function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <select
        aria-label={label}
        multiple
        className="mt-1 min-h-24 w-full rounded border border-gray-300 p-1 text-sm"
        value={value}
        onChange={(event) =>
          onChange(
            Array.from(event.target.selectedOptions, (option) => option.value)
          )
        }
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export function SingleSelectFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <select
        aria-label={label}
        className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function BooleanFilter({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between text-sm font-medium text-gray-700">
      <span>{label}</span>
      <input
        aria-label={label}
        type="checkbox"
        className="h-4 w-4 rounded accent-blue-600"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
