import Card from "@/components/ui/Card";
import { cn } from "@/utils/cn";

export interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  positive?: boolean | null;
}

export default function StatCard({ label, value, subtext, positive }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p
        className={cn(
          "text-xl font-bold",
          positive === true && "text-green-600 dark:text-green-400",
          positive === false && "text-red-600 dark:text-red-400",
          positive === null || positive === undefined
            ? "text-gray-900 dark:text-gray-100"
            : "",
        )}
      >
        {value}
      </p>
      {subtext && (
        <p
          className={cn(
            "text-xs font-medium",
            positive === true && "text-green-600 dark:text-green-400",
            positive === false && "text-red-600 dark:text-red-400",
            positive === null || positive === undefined
              ? "text-gray-500 dark:text-gray-400"
              : "",
          )}
        >
          {subtext}
        </p>
      )}
    </Card>
  );
}
