import Flatpickr from "react-flatpickr";
import { cn } from "@/utils/cn";
import "flatpickr/dist/flatpickr.min.css";
import "flatpickr/dist/themes/airbnb.css";

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

function formatForDisplay(val: string): string {
  if (!val) return "";
  const d = new Date(val + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  label,
  className,
}: DatePickerProps) {
  return (
    <div className={cn("relative", className)}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <Flatpickr
        value={value || undefined}
        onChange={(_dates: Date[], dateStr: string) => onChange(dateStr)}
        options={{
          dateFormat: "Y-m-d",
          altInput: true,
          altFormat: "M j, Y",
          allowInput: true,
          animate: true,
          monthSelectorType: "dropdown",
          prevArrow: "<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M15 18l-6-6 6-6'/></svg>",
          nextArrow: "<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><path d='M9 18l6-6-6-6'/></svg>",
        }}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900",
          "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500",
          "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100",
          "placeholder:text-gray-400 dark:placeholder:text-gray-500",
        )}
      />
    </div>
  );
}
