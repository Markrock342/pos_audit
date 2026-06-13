import { getTransactions } from "./transactions";
import { getOrganization } from "./organizations";
import { calculateExpectedBalance } from "./cashCounts";
import { getDb } from "@/lib/db/supabase";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { getBusinessToday } from "@/lib/utils/businessDate";
import type { BalanceSummary } from "@/types";

export interface DashboardData {
  todayIncome: number;
  todayExpense: number;
  monthIncome: number;
  monthExpense: number;
  netProfit: number;
  expectedCashBalance: number;
  transactionCount: number;
}

export interface CategoryReportItem {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  type: "income" | "expense";
  total: number;
  count: number;
}

export async function getByCategory(
  startDate: string,
  endDate: string
): Promise<CategoryReportItem[]> {
  const transactions = await getTransactions(DEFAULT_ORG_ID, {
    startDate,
    endDate,
    status: "active",
  });

  const { data: categoriesData } = await getDb()
    .from("categories")
    .select("id, name, color, type")
    .eq("organization_id", DEFAULT_ORG_ID);

  const categories = (categoriesData ?? []) as Array<{
    id: string;
    name: string;
    color: string;
    type: "income" | "expense";
  }>;

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const totals = new Map<string, { total: number; count: number }>();

  for (const t of transactions) {
    const lines = t.lineItems && t.lineItems.length > 0 ? t.lineItems : null;

    if (lines) {
      for (const line of lines) {
        const key = line.categoryId;
        const current = totals.get(key) ?? { total: 0, count: 0 };
        current.total += line.lineAmount;
        current.count += 1;
        totals.set(key, current);
      }
    } else {
      const key = t.categoryId;
      const current = totals.get(key) ?? { total: 0, count: 0 };
      current.total += t.amount;
      current.count += 1;
      totals.set(key, current);
    }
  }

  const result: CategoryReportItem[] = [];
  for (const [categoryId, { total, count }] of totals) {
    const cat = categoryMap.get(categoryId);
    if (cat) {
      result.push({
        categoryId,
        categoryName: cat.name,
        categoryColor: cat.color,
        type: cat.type,
        total,
        count,
      });
    }
  }

  return result.sort((a, b) => b.total - a.total);
}

export interface DailyChartItem {
  date: string;
  income: number;
  expense: number;
}

export async function getDailyChart(
  startDate: string,
  endDate: string
): Promise<DailyChartItem[]> {
  const transactions = await getTransactions(DEFAULT_ORG_ID, {
    startDate,
    endDate,
    status: "active",
  });

  const dailyMap = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    const date = t.transactionDate;
    const current = dailyMap.get(date) ?? { income: 0, expense: 0 };
    if (t.type === "income") {
      current.income += t.amount;
    } else {
      current.expense += t.amount;
    }
    dailyMap.set(date, current);
  }

  const result: DailyChartItem[] = [];
  for (const [date, { income, expense }] of dailyMap) {
    result.push({ date, income, expense });
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getDashboard(): Promise<DashboardData> {
  const today = getBusinessToday();
  const monthStart = `${today.slice(0, 7)}-01`;
  const monthEnd = today;

  // Active transactions for today
  const todayTransactions = await getTransactions(DEFAULT_ORG_ID, {
    startDate: today,
    endDate: today,
    status: "active",
  });

  const todayIncome = todayTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const todayExpense = todayTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Active transactions for current month
  const monthTransactions = await getTransactions(DEFAULT_ORG_ID, {
    startDate: monthStart,
    endDate: monthEnd,
    status: "active",
  });

  const monthIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Expected cash balance: today's cash income - today's cash expense
  const cashIncome = todayTransactions
    .filter((t) => t.type === "income" && t.paymentMethod === "cash")
    .reduce((sum, t) => sum + t.amount, 0);

  const cashExpense = todayTransactions
    .filter((t) => t.type === "expense" && t.paymentMethod === "cash")
    .reduce((sum, t) => sum + t.amount, 0);

  // Check for today's cash count opening balance
  const { data: cashCount } = await getDb()
    .from("cash_counts")
    .select("opening_balance")
    .eq("organization_id", DEFAULT_ORG_ID)
    .eq("count_date", today)
    .single();

  const openingBalance = (cashCount?.opening_balance as number) ?? 0;
  const expectedCashBalance = await calculateExpectedBalance(
    DEFAULT_ORG_ID,
    today,
    openingBalance
  );

  return {
    todayIncome,
    todayExpense,
    monthIncome,
    monthExpense,
    netProfit: monthIncome - monthExpense,
    expectedCashBalance,
    transactionCount: monthTransactions.length,
  };
}

export async function getBalanceSummary(
  startDate: string,
  endDate: string
): Promise<BalanceSummary> {
  const org = await getOrganization(DEFAULT_ORG_ID);
  const finance = org?.financeConfig;
  const periodMonth = startDate.slice(0, 7);
  const applyOpening =
    startDate.endsWith("-01") &&
    (!finance?.openingBalanceMonth || finance.openingBalanceMonth === periodMonth);

  const openingCash = applyOpening ? (finance?.openingCashBalance ?? 0) : 0;
  const openingSavings = applyOpening ? (finance?.openingSavingsBalance ?? 0) : 0;

  const transactions = await getTransactions(DEFAULT_ORG_ID, {
    startDate,
    endDate,
    status: "active",
  });

  let totalIncome = 0;
  let totalExpense = 0;
  let cashIncome = 0;
  let cashExpense = 0;
  let savingsIncome = 0;
  let savingsExpense = 0;

  for (const t of transactions) {
    if (t.type === "income") {
      totalIncome += t.amount;
      if (t.paymentMethod === "cash") cashIncome += t.amount;
      else savingsIncome += t.amount;
    } else {
      totalExpense += t.amount;
      if (t.paymentMethod === "cash") cashExpense += t.amount;
      else savingsExpense += t.amount;
    }
  }

  const cashBalance = openingCash + cashIncome - cashExpense;
  const savingsBalance = openingSavings + savingsIncome - savingsExpense;

  return {
    dateRange: { start: startDate, end: endDate },
    openingCash,
    openingSavings,
    totalIncome,
    totalExpense,
    cashIncome,
    cashExpense,
    savingsIncome,
    savingsExpense,
    cashBalance,
    savingsBalance,
    totalBalance: cashBalance + savingsBalance,
  };
}
