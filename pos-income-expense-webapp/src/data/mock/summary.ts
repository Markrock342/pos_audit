import type { DashboardSummary, ReportSummary } from "@/types";
import { mockTransactions } from "./transactions";

function sumByType(type: "income" | "expense", start?: Date, end?: Date) {
  return mockTransactions
    .filter((t) => {
      if (t.type !== type) return false;
      const date = new Date(t.createdAt);
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

const today = new Date("2026-06-06");
const monthStart = new Date("2026-06-01");

export const mockDashboardSummary: DashboardSummary = {
  todayIncome: sumByType("income", today),
  todayExpense: sumByType("expense", today),
  monthIncome: sumByType("income", monthStart),
  monthExpense: sumByType("expense", monthStart),
  netProfit: sumByType("income", monthStart) - sumByType("expense", monthStart),
  transactionCount: mockTransactions.length,
};

export const mockReportSummary: ReportSummary = {
  totalIncome: sumByType("income", monthStart),
  totalExpense: sumByType("expense", monthStart),
  netProfit: sumByType("income", monthStart) - sumByType("expense", monthStart),
  dateRange: {
    start: "2026-06-01",
    end: "2026-06-06",
  },
};

export const mockChartData = [
  { date: "1 มิ.ย.", income: 1200, expense: 3500 },
  { date: "2 มิ.ย.", income: 980, expense: 450 },
  { date: "3 มิ.ย.", income: 1450, expense: 200 },
  { date: "4 มิ.ย.", income: 1100, expense: 850 },
  { date: "5 มิ.ย.", income: 1320, expense: 1200 },
  { date: "6 มิ.ย.", income: 290, expense: 0 },
];
