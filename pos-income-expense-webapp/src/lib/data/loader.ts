import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { getCashCountByDate } from "@/lib/services/db/cashCounts";
import { getCategories } from "@/lib/services/db/categories";
import { getDailyLedgerSummary } from "@/lib/services/db/dailyLedger";
import type { DashboardData } from "@/lib/services/db/reports";
import { getTransactions } from "@/lib/services/db/transactions";
import {
  activeCashClosing,
  activeTodayExpense,
  activeTodayIncome,
} from "@/lib/utils/activeDayDisplay";
import { isInCloseEditMode } from "@/lib/utils/closeEditUtils";
import { getBusinessToday, shiftBusinessDate } from "@/lib/utils/businessDate";
import { filterTodayTransactionsForSession } from "@/lib/utils/sessionRound";
import type { Category, DailyCloseStatus, Transaction, TransactionType } from "@/types";
type TransactionFilters = {
  type?: TransactionType;
  status?: "active" | "void";
  startDate?: string;
  endDate?: string;
};

type TransactionLoadOptions = {
  includeLineItems?: boolean;
  limit?: number;
};

export async function loadTransactions(
  filters?: TransactionFilters,
  options?: TransactionLoadOptions
): Promise<Transaction[]> {
  return getTransactions(DEFAULT_ORG_ID, filters, options);
}

export async function loadCategories(type?: TransactionType): Promise<Category[]> {
  return getCategories(DEFAULT_ORG_ID, type);
}

export async function loadRecentTransactions(limit = 5): Promise<Transaction[]> {
  return getTransactions(
    DEFAULT_ORG_ID,
    { status: "active" },
    { includeLineItems: false, limit }
  );
}

export async function loadChartTransactions(days = 7): Promise<Transaction[]> {
  const startDate = shiftBusinessDate(getBusinessToday(), -(days - 1));

  return getTransactions(
    DEFAULT_ORG_ID,
    { status: "active", startDate },
    { includeLineItems: false }
  );
}

export type DashboardPageData = {
  dashboardData: DashboardData;
  todayLedger: Awaited<ReturnType<typeof getDailyLedgerSummary>> | null;
};

/** โหลด dashboard ครั้งเดียว — ลด query ซ้ำไป Supabase */
export async function loadDashboardPageData(): Promise<DashboardPageData> {
  const today = getBusinessToday();
  const monthStart = `${today.slice(0, 7)}-01`;

  const [transactions, cashCount] = await Promise.all([
    getTransactions(
      DEFAULT_ORG_ID,
      { status: "active", startDate: monthStart, endDate: today },
      { includeLineItems: false }
    ),
    getCashCountByDate(DEFAULT_ORG_ID, today),
  ]);

  const sessionRound = cashCount?.sessionRound ?? 1;
  const todayTransactions = filterTodayTransactionsForSession(
    transactions,
    today,
    sessionRound
  );
  const monthTransactions = transactions.filter(
    (t) => t.transactionDate >= monthStart && t.transactionDate <= today
  );

  const todayLedger = await getDailyLedgerSummary(DEFAULT_ORG_ID, today, {
    dayTransactions: todayTransactions,
    cashCount,
  });

  const dailyCloseStatus: DailyCloseStatus = {
    countDate: today,
    isLocked: todayLedger.isLocked && !isInCloseEditMode(cashCount),
    closedAt: todayLedger.closedAt,
    autoClosed: todayLedger.autoClosed,
    hasManualCount: !!cashCount?.hasManualCount,
    cashClosing: todayLedger.cash.closing,
    transferClosing: todayLedger.transfer.closing,
    netTotal: todayLedger.business.netTotal,
    inCloseEditMode: isInCloseEditMode(cashCount),
    closeEditGeneration: cashCount?.closeEditGeneration,
  };
  const sum = (rows: Transaction[], type: "income" | "expense") =>
    rows.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);

  const rawTodayIncome = sum(todayTransactions, "income");
  const rawTodayExpense = sum(todayTransactions, "expense");

  const dashboardData: DashboardData = {
    todayIncome: activeTodayIncome(rawTodayIncome, dailyCloseStatus),
    todayExpense: activeTodayExpense(rawTodayExpense, dailyCloseStatus),
    monthIncome: sum(monthTransactions, "income"),
    monthExpense: sum(monthTransactions, "expense"),
    netProfit: sum(monthTransactions, "income") - sum(monthTransactions, "expense"),
    expectedCashBalance: activeCashClosing(dailyCloseStatus.cashClosing, dailyCloseStatus),
    transactionCount: monthTransactions.length,
    dailyCloseStatus,
    ledger: todayLedger,
  };

  return {
    dashboardData,
    todayLedger,
  };
}