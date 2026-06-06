import type { ReportSummary } from "@/types";
import { getTransactions } from "./transactions";

function sumByType(type: "income" | "expense", start?: Date, end?: Date) {
  return getTransactions(type)
    .filter((transaction) => {
      const date = new Date(transaction.createdAt);
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function getReportSummary(): ReportSummary {
  const monthStart = new Date("2026-06-01");
  const totalIncome = sumByType("income", monthStart);
  const totalExpense = sumByType("expense", monthStart);

  return {
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
    dateRange: {
      start: "2026-06-01",
      end: "2026-06-06",
    },
  };
}
