import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface IncomeTrendChartProps {
  data: { month: string; income: number; expenses: number }[];
}

export default function IncomeTrendChart({ data }: IncomeTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="month" tick={{ fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
          contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
        />
        <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 16 }} />
        <Bar dataKey="income" fill="#14b8a6" name="Income" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" fill="#f43f5e" name="Expenses" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
