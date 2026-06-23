import type { DailyCloseStatus, DashboardSummary, Transaction } from "@/types";
import { getBusinessToday, shiftBusinessDate } from "@/lib/utils/businessDate";
import { isTodayBusinessClosed } from "@/lib/utils/activeDayDisplay";

function sumByType(
  transactions: Transaction[],
  type: "income" | "expense",
  start?: string,
  end?: string
) {
  return transactions
    .filter((t) => {
      if (t.type !== type || t.status !== "active") return false;
      const d = t.transactionDate;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

export function buildDashboardSummary(transactions: Transaction[]): DashboardSummary {
  const today = getBusinessToday();
  const monthStart = `${today.slice(0, 7)}-01`;
  const active = transactions.filter((t) => t.status === "active");

  return {
    todayIncome: sumByType(active, "income", today, today),
    todayExpense: sumByType(active, "expense", today, today),
    monthIncome: sumByType(active, "income", monthStart),
    monthExpense: sumByType(active, "expense", monthStart),
    netProfit: sumByType(active, "income", monthStart) - sumByType(active, "expense", monthStart),
    transactionCount: active.length,
  };
}

function formatChartLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function buildChartData(
  transactions: Transaction[],
  days = 7,
  dailyCloseStatus?: DailyCloseStatus
) {
  const today = getBusinessToday();
  const todayClosed = dailyCloseStatus ? isTodayBusinessClosed(dailyCloseStatus) : false;
  const result: { date: string; income: number; expense: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const key = shiftBusinessDate(today, -i);
    const isToday = key === today;
    result.push({
      date: formatChartLabel(key),
      income: isToday && todayClosed ? 0 : sumByType(transactions, "income", key, key),
      expense: isToday && todayClosed ? 0 : sumByType(transactions, "expense", key, key),
    });
  }

  return result;
}
