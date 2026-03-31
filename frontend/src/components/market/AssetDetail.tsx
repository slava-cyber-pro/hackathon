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
import Badge from "@/components/ui/Badge";
import { cn } from "@/utils/cn";
import { useAssetDetail, usePriceHistory } from "@/hooks/useMarket";

const PERIOD_OPTIONS = [
  { label: "1W", value: "1wk" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
] as const;

interface Props {
  ticker: string;
  category: string;
  formatCurrency: (n: number) => string;
  onBack: () => void;
  onAdd: () => void;
}

function formatCompact(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export default function AssetDetail({
  ticker,
  category,
  formatCurrency,
  onBack,
  onAdd,
}: Props) {
  const [period, setPeriod] = useState("3mo");
  const gradientId = useId();

  const { data: detail, isLoading, isError } = useAssetDetail(ticker, category);
  const {
    data: history,
    isLoading: histLoading,
  } = usePriceHistory(ticker, category, period);

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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          &larr; Back to list
        </button>
        <Card>
          <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Failed to load asset details.
          </p>
        </Card>
      </div>
    );
  }

  const isUp = detail.change_24h_pct >= 0;

  const stats = [
    { label: "Market Cap", value: formatCompact(detail.market_cap) },
    { label: "Volume", value: formatCompact(detail.volume) },
    { label: "52W High", value: formatCurrency(detail.high_52w) },
    { label: "52W Low", value: formatCurrency(detail.low_52w) },
  ];

  return (
    <div className="space-y-4">
      {/* Back link */}
      <button
        onClick={onBack}
        className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
      >
        &larr; Back to list
      </button>

      {/* Header */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded bg-gray-100 px-2 py-1 font-mono text-sm font-bold text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                {detail.symbol}
              </span>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {detail.name}
              </h2>
              <Badge color="teal">{detail.category}</Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(detail.price)}
              </span>
              <span
                className={cn(
                  "text-lg font-bold",
                  isUp
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {isUp ? "\u2191" : "\u2193"} {isUp ? "+" : ""}
                {detail.change_24h_pct.toFixed(2)}%
              </span>
            </div>
          </div>
          <Button onClick={onAdd}>+ Add to Portfolio</Button>
        </div>
      </Card>

      {/* Chart */}
      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Price History
          </h3>
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

        {histLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : chartData.length === 0 ? (
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
                formatter={(value: number) => [
                  `$${value.toLocaleString()}`,
                  "Price",
                ]}
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex flex-col gap-1 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {s.label}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Description */}
      {detail.description && (
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            About {detail.name}
          </h3>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {detail.description}
          </p>
        </Card>
      )}
    </div>
  );
}
