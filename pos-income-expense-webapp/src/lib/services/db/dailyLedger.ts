import { getBusinessToday, getBusinessYesterday } from "@/lib/utils/businessDate";
import {
  getCashCountByDate,
  isBusinessDateClosed,
  isCashCountLocked,
} from "./cashCounts";
import { getTotalWithdrawnForDate } from "./cashWithdrawals";
import { getTotalDepositedForDate } from "./cashDeposits";
import { getOrganization } from "./organizations";
import { getTransactions } from "./transactions";
import { isFullDailyReset } from "@/lib/utils/dailyResetMode";
import type { CashCount, DailyCloseStatus, DailyLedgerSummary, PaymentMethod, Transaction } from "@/types";

/** เงินโอน/บัญชีในสมุด — ทุกช่องทางที่ไม่ใช่เงินสด */
export function isTransferLedgerPayment(method: PaymentMethod): boolean {
  return method !== "cash";
}

export function ledgerPatchFromSummary(summary: DailyLedgerSummary): Record<string, unknown> {
  return {
    opening_transfer: summary.transfer.opening,
    cash_income: summary.cash.income,
    cash_expense: summary.cash.expense,
    cash_withdrawn: summary.cash.withdrawn,
    closing_cash: summary.cash.closing,
    transfer_income: summary.transfer.income,
    transfer_expense: summary.transfer.expense,
    closing_transfer: summary.transfer.closing,
    total_income: summary.business.totalIncome,
    total_expense: summary.business.totalExpense,
    net_total: summary.business.netTotal,
    expected_balance: summary.cash.closing,
  };
}

/** อ่านสรุป 2 กระเป๋าจากฟิลด์ที่ sync ไว้ใน cash_counts — ใช้เฉพาะวันที่ปิดแล้ว */
export function summaryFromStoredLedgerFields(
  cashCount: CashCount,
  countDate: string,
  businessToday: string
): DailyLedgerSummary | null {
  if (cashCount.cashIncome == null && cashCount.totalIncome == null) return null;

  const opening = 0;
  const income = cashCount.cashIncome ?? 0;
  const expense = cashCount.cashExpense ?? 0;
  const withdrawn = cashCount.cashWithdrawn ?? 0;
  const closing = cashCount.closingCash ?? cashCount.expectedBalance ?? 0;
  const deposited = Math.max(0, closing - opening - income + expense + withdrawn);

  return {
    countDate,
    businessToday,
    isLocked: isCashCountLocked(cashCount, businessToday),
    closedAt: cashCount.closedAt,
    closingType: cashCount.closingType,
    autoClosed: cashCount.autoClosed,
    cash: {
      opening: 0,
      income,
      expense,
      withdrawn,
      deposited,
      closing,
    },
    transfer: {
      opening: cashCount.openingTransfer ?? 0,
      income: cashCount.transferIncome ?? 0,
      expense: cashCount.transferExpense ?? 0,
      closing: cashCount.closingTransfer ?? 0,
    },
    business: {
      totalIncome: cashCount.totalIncome ?? 0,
      totalExpense: cashCount.totalExpense ?? 0,
      netTotal: cashCount.netTotal ?? 0,
    },
  };
}

async function getCashOpeningForDate(
  _organizationId: string,
  _countDate: string
): Promise<number> {
  return 0;
}

async function getTransferOpeningForDate(
  organizationId: string,
  countDate: string
): Promise<number> {
  const row = await getCashCountByDate(organizationId, countDate);
  if (row) return row.openingTransfer ?? 0;

  const org = await getOrganization(organizationId);
  if (isFullDailyReset(org?.financeConfig)) {
    return 0;
  }

  const yesterday = getBusinessYesterday(countDate);
  const prev = await getCashCountByDate(organizationId, yesterday);
  if (prev?.closedAt && prev.closingTransfer != null) {
    return prev.closingTransfer;
  }
  const finance = org?.financeConfig;
  const month = finance?.openingBalanceMonth ?? countDate.slice(0, 7);
  const monthStart = `${month}-01`;

  let opening = 0;
  if (countDate >= monthStart) {
    opening = finance?.openingSavingsBalance ?? 0;
  }

  const dayBefore = getBusinessYesterday(countDate);
  if (dayBefore < monthStart) return opening;

  const prior = await getTransactions(
    organizationId,
    {
      status: "active",
      startDate: monthStart,
      endDate: dayBefore,
    },
    { includeLineItems: false }
  );

  for (const t of prior) {
    if (!isTransferLedgerPayment(t.paymentMethod)) continue;
    if (t.type === "income") opening += t.amount;
    else opening -= t.amount;
  }

  return opening;
}

export type LedgerTransactionDelta = Pick<Transaction, "type" | "amount" | "paymentMethod">;

/** อัปเดต snapshot จากรายการเดียว — เร็วกว่าคำนวณทั้งวันใหม่ */
export function applyTransactionToLedgerSummary(
  summary: DailyLedgerSummary,
  transaction: LedgerTransactionDelta,
  mode: "apply" | "revert"
): DailyLedgerSummary {
  const sign = mode === "apply" ? 1 : -1;
  const amount = transaction.amount * sign;
  const isCash = transaction.paymentMethod === "cash";

  const cash = { ...summary.cash };
  const transfer = { ...summary.transfer };
  const business = { ...summary.business };

  if (transaction.type === "income") {
    business.totalIncome += amount;
    if (isCash) cash.income += amount;
    else transfer.income += amount;
  } else {
    business.totalExpense += amount;
    if (isCash) cash.expense += amount;
    else transfer.expense += amount;
  }

  business.netTotal = business.totalIncome - business.totalExpense;
  cash.closing = cash.opening + cash.income - cash.expense - cash.withdrawn + cash.deposited;
  transfer.closing = transfer.opening + transfer.income - transfer.expense;

  return { ...summary, cash, transfer, business };
}

export async function getDailyLedgerSummary(
  organizationId: string,
  countDate: string,
  options?: { dayTransactions?: Transaction[]; forceRecalc?: boolean }
): Promise<DailyLedgerSummary> {
  const businessToday = getBusinessToday();
  const cashCount = await getCashCountByDate(organizationId, countDate);

  if (!options?.forceRecalc && cashCount?.closedAt) {
    const stored = summaryFromStoredLedgerFields(cashCount, countDate, businessToday);
    if (stored) return stored;
  }

  const transactions =
    options?.dayTransactions ??
    (await getTransactions(
      organizationId,
      {
        status: "active",
        startDate: countDate,
        endDate: countDate,
      },
      { includeLineItems: false }
    ));

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

  const [cashOpening, transferOpening, cashWithdrawn, cashDeposited] = await Promise.all([
    getCashOpeningForDate(organizationId, countDate),
    getTransferOpeningForDate(organizationId, countDate),
    getTotalWithdrawnForDate(organizationId, countDate),
    getTotalDepositedForDate(organizationId, countDate),
  ]);

  const cashClosing = cashOpening + cashIncome - cashExpense - cashWithdrawn + cashDeposited;
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
      deposited: cashDeposited,
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

export async function getDailyCloseStatus(
  organizationId: string,
  options?: { dayTransactions?: Transaction[] }
): Promise<DailyCloseStatus> {
  const businessToday = getBusinessToday();
  const summary = await getDailyLedgerSummary(organizationId, businessToday, options);
  const cashCount = await getCashCountByDate(organizationId, businessToday);

  return {
    countDate: businessToday,
    isLocked: summary.isLocked,
    closedAt: summary.closedAt,
    autoClosed: summary.autoClosed,
    hasManualCount: !!cashCount?.hasManualCount,
    cashClosing: summary.cash.closing,
    transferClosing: summary.transfer.closing,
    netTotal: summary.business.netTotal,
  };
}
