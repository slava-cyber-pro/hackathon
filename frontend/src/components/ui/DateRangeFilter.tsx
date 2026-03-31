import { cn } from "@/utils/cn";
import DatePicker from "./DatePicker";

const PRESETS = [
  { label: "This month", key: "month" },
  { label: "Last 3 months", key: "3m" },
  { label: "Last 6 months", key: "6m" },
  { label: "This year", key: "year" },
  { label: "All time", key: "all" },
] as const;

type PresetKey = (typeof PRESETS)[number]["key"];

function getPresetDates(key: PresetKey): { from: string; to: string } | null {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);

  switch (key) {
    case "month":
      return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`, to };
    case "3m": {
      const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { from: d.toISOString().slice(0, 10), to };
    }
    case "6m": {
      const d = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return { from: d.toISOString().slice(0, 10), to };
    }
    case "year":
      return { from: `${now.getFullYear()}-01-01`, to };
    case "all":
      return null;
  }
}

export interface DateRangeFilterProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onClear: () => void;
  className?: string;
}

export default function DateRangeFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClear,
  className,
}: DateRangeFilterProps) {
  const handlePreset = (key: PresetKey) => {
    const dates = getPresetDates(key);
    if (dates) {
      onDateFromChange(dates.from);
      onDateToChange(dates.to);
    } else {
      onClear();
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {PRESETS.map((p) => {
        const dates = getPresetDates(p.key);
        const isActive = dates ? dateFrom === dates.from && dateTo === dates.to : !dateFrom && !dateTo;
        return (
          <button
            key={p.key}
            onClick={() => handlePreset(p.key)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
            )}
          >
            {p.label}
          </button>
        );
      })}
      <div className="flex items-center gap-1.5">
        <DatePicker value={dateFrom} onChange={onDateFromChange} placeholder="From" />
        <span className="text-xs text-gray-400">to</span>
        <DatePicker value={dateTo} onChange={onDateToChange} placeholder="To" />
      </div>
    </div>
  );
}
