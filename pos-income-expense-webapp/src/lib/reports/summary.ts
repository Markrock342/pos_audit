import type { DashboardSummary, Transaction } from "@/types";

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

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
  const today = dateKey(new Date());
  const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
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

export function buildChartData(transactions: Transaction[], days = 6) {
  const result: { date: string; income: number; expense: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const label = d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });

    result.push({
      date: label,
      income: sumByType(transactions, "income", key, key),
      expense: sumByType(transactions, "expense", key, key),
    });
  }

  return result;
}
