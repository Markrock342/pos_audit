import { getBusinessToday, getBusinessYesterday } from "@/lib/utils/businessDate";
import {
  calculateExpectedBalance,
  getCashCountByDate,
  isBusinessDateClosed,
  isCashCountLocked,
} from "./cashCounts";
import { getTotalWithdrawnForDate } from "./cashWithdrawals";
import { getOrganization } from "./organizations";
import { getTransactions } from "./transactions";
import type { DailyLedgerSummary, PaymentMethod } from "@/types";

/** เงินโอน/บัญชีในสมุด — ทุกช่องทางที่ไม่ใช่เงินสด */
export function isTransferLedgerPayment(method: PaymentMethod): boolean {
  return method !== "cash";
}

async function getCashOpeningForDate(
  organizationId: string,
  countDate: string
): Promise<number> {
  const row = await getCashCountByDate(organizationId, countDate);
  if (row) return row.openingBalance;

  const yesterday = getBusinessYesterday(countDate);
  const prev = await getCashCountByDate(organizationId, yesterday);
  if (prev) {
    if (prev.closedAt) return prev.actualBalance;
    return calculateExpectedBalance(organizationId, yesterday, prev.openingBalance);
  }

  const org = await getOrganization(organizationId);
  const finance = org?.financeConfig;
  const month = finance?.openingBalanceMonth ?? countDate.slice(0, 7);
  if (countDate >= `${month}-01`) {
    return finance?.openingCashBalance ?? 0;
  }
  return 0;
}

async function getTransferOpeningForDate(
  organizationId: string,
  countDate: string
): Promise<number> {
  const org = await getOrganization(organizationId);
  const finance = org?.financeConfig;
  const month = finance?.openingBalanceMonth ?? countDate.slice(0, 7);
  const monthStart = `${month}-01`;

  let opening = 0;
  if (countDate >= monthStart) {
    opening = finance?.openingSavingsBalance ?? 0;
  }

  const dayBefore = getBusinessYesterday(countDate);
  if (dayBefore < monthStart) return opening;

  const prior = await getTransactions(organizationId, {
    status: "active",
    startDate: monthStart,
    endDate: dayBefore,
  });

  for (const t of prior) {
    if (!isTransferLedgerPayment(t.paymentMethod)) continue;
    if (t.type === "income") opening += t.amount;
    else opening -= t.amount;
  }

  return opening;
}

export async function getDailyLedgerSummary(
  organizationId: string,
  countDate: string
): Promise<DailyLedgerSummary> {
  const businessToday = getBusinessToday();
  const cashCount = await getCashCountByDate(organizationId, countDate);

  const transactions = await getTransactions(organizationId, {
    status: "active",
    startDate: countDate,
    endDate: countDate,
  });

  let cashIncome = 0;
  let cashExpense = 0;
  let transferIncome = 0;
  let transferExpense = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of transactions) {
    if (t.type === "income") {
      totalIncome += t.amount;
      if (t.paymentMethod === "cash") cashIncome += t.amount;
      else transferIncome += t.amount;
    } else {
      totalExpense += t.amount;
      if (t.paymentMethod === "cash") cashExpense += t.amount;
      else transferExpense += t.amount;
    }
  }

  const [cashOpening, transferOpening, cashWithdrawn] = await Promise.all([
    getCashOpeningForDate(organizationId, countDate),
    getTransferOpeningForDate(organizationId, countDate),
    getTotalWithdrawnForDate(organizationId, countDate),
  ]);

  const cashClosing = cashOpening + cashIncome - cashExpense - cashWithdrawn;
  const transferClosing = transferOpening + transferIncome - transferExpense;

  const isLocked = cashCount
    ? isCashCountLocked(cashCount, businessToday)
    : await isBusinessDateClosed(organizationId, countDate);

  return {
    countDate,
    businessToday,
    isLocked,
    closedAt: cashCount?.closedAt,
    closingType: cashCount?.closingType,
    autoClosed: cashCount?.autoClosed,
    cash: {
      opening: cashOpening,
      income: cashIncome,
      expense: cashExpense,
      withdrawn: cashWithdrawn,
      closing: cashClosing,
    },
    transfer: {
      opening: transferOpening,
      income: transferIncome,
      expense: transferExpense,
      closing: transferClosing,
    },
    business: {
      totalIncome,
      totalExpense,
      netTotal: totalIncome - totalExpense,
    },
  };
}
