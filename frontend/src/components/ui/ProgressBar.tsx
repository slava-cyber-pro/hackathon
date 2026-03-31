import { cn } from "@/utils/cn";

export interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
}

export default function ProgressBar({ value, max = 100, className }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const overBudget = value > max;
  const warning = pct >= 80 && !overBudget;

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all",
          overBudget ? "bg-red-500" : warning ? "bg-amber-500" : "bg-primary-500",
        )}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}
