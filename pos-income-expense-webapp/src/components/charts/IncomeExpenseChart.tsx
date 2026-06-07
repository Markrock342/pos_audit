"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartDataPoint {
  date: string;
  income: number;
  expense: number;
}

interface IncomeExpenseChartProps {
  data: ChartDataPoint[];
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  return (
    <div className="h-72 min-h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
          <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
          <Tooltip
            formatter={(value) =>
              typeof value === "number"
                ? `฿${value.toLocaleString("th-TH")}`
                : value
            }
            contentStyle={{
              backgroundColor: "var(--surface-elevated)",
              borderColor: "var(--border-default)",
              color: "var(--text-main)",
            }}
          />
          <Legend wrapperStyle={{ color: "var(--text-main)" }} />
          <Bar dataKey="income" name="รายรับ" fill="#2a7a3b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="รายจ่าย" fill="#c0322a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
