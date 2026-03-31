import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { cn } from "@/utils/cn";

export type TransactionType = "all" | "income" | "expense";

const filterOptions: { label: string; value: TransactionType }[] = [
  { label: "All", value: "all" },
  { label: "Income", value: "income" },
  { label: "Expense", value: "expense" },
];

interface TransactionFiltersProps {
  activeFilter: TransactionType;
  onFilterChange: (filter: TransactionType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function TransactionFilters({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: TransactionFiltersProps) {
  return (
    <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onFilterChange(opt.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeFilter === opt.value
                ? "bg-primary-600 text-white dark:bg-primary-500"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:inline">
          Mar 1 – Mar 30, 2026
        </span>
        <div className="w-full md:w-56">
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </Card>
  );
}
