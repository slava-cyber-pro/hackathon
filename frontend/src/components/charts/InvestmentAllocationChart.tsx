import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface InvestmentAllocationChartProps {
  data: { name: string; value: number; color: string }[];
}

export default function InvestmentAllocationChart({ data }: InvestmentAllocationChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie data={data} cx="50%" cy="45%" innerRadius={60} outerRadius={100} dataKey="value" stroke="none">
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
          contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
        />
        <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 16 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
