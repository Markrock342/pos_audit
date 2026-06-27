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

function formatBaht(value: number) {
  return `฿${value.toLocaleString("th-TH")}`;
}

function IncomeExpenseTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const income = payload.find((item) => item.dataKey === "income");
  const expense = payload.find((item) => item.dataKey === "expense");

  return (
    <div className="rounded-xl border border-border-default bg-surface-elevated px-3.5 py-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
      <p className="mb-2 text-xs font-medium text-text-secondary">{label}</p>
      <div className="space-y-1">
        {income != null && typeof income.value === "number" && (
          <p className="text-sm font-bold text-income">
            รายรับ : {formatBaht(income.value)}
          </p>
        )}
        {expense != null && typeof expense.value === "number" && (
          <p className="text-sm font-bold text-expense">
            รายจ่าย : {formatBaht(expense.value)}
          </p>
        )}
      </div>
    </div>
  );
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
            content={<IncomeExpenseTooltip />}
          />
          <Legend wrapperStyle={{ color: "var(--text-main)" }} />
          <Bar dataKey="income" name="รายรับ" fill="#2a7a3b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="รายจ่าย" fill="#c0322a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
