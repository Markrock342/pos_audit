"use client";

import { useEffect, useState } from "react";
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
  className?: string;
}

export function IncomeExpenseChart({ data, className = "" }: IncomeExpenseChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`h-72 min-h-72 w-full min-w-0 ${className}`} aria-hidden />;
  }

  return (
    <div className={`page-enter h-72 min-h-72 w-full min-w-0 ${className}`}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
          <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
          <Tooltip
            cursor={{ fill: "var(--surface-hover)", fillOpacity: 0.35 }}
            formatter={(value) =>
              typeof value === "number"
                ? `฿${value.toLocaleString("th-TH")}`
                : value
            }
            contentStyle={{
              backgroundColor: "var(--surface-elevated)",
              borderColor: "var(--border-default)",
              borderRadius: "0.75rem",
              color: "var(--text-main)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
            }}
            labelStyle={{ color: "var(--text-secondary)" }}
            itemStyle={{ color: "var(--text-main)" }}
          />
          <Legend wrapperStyle={{ color: "var(--text-main)" }} />
          <Bar dataKey="income" name="รายรับ" fill="#2a7a3b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="รายจ่าย" fill="#c0322a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
