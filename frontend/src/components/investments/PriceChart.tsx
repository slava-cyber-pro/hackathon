import { useId, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { usePriceHistory } from "@/hooks/useMarket";

const PERIOD_OPTIONS = [
  { label: "1W", value: "1wk" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
] as const;

export interface PriceChartProps {
  ticker: string;
  category: string;
  name: string;
}

export default function PriceChart({ ticker, category, name }: PriceChartProps) {
  const [period, setPeriod] = useState("3mo");
  const { data: history, isLoading, isError } = usePriceHistory(ticker, category, period);
  const gradientId = useId();

  const chartData = useMemo(
    () =>
      history
        ? history.map((p) => ({
            date: new Date(p.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            close: p.close,
          }))
        : [],
    [history],
  );

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {ticker} &mdash; {name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Price history
          </p>
        </div>
        <div className="flex items-center gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={period === opt.value ? "primary" : "secondary"}
              size="sm"
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : isError || chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Price history unavailable
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
              tickFormatter={(v) =>
                v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(2)}`
              }
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Price"]}
              contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke="#14b8a6"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
