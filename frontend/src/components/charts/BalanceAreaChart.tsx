import { useId } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface BalanceAreaChartProps {
  data: { month: string; balance: number }[];
}

export default function BalanceAreaChart({ data }: BalanceAreaChartProps) {
  const gradientId = useId();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value: number) => [`$${value.toLocaleString()}`, "Balance"]}
          contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="#14b8a6"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
