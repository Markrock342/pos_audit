import { getDb } from "@/lib/db/supabase";
import { getBusinessToday } from "@/lib/utils/businessDate";
import {
  ensureDailyCashCountCycle,
  getCashCountByDate,
  getCashCounts,
  refreshOpenDailyCloseRecord,
} from "@/lib/services/db/cashCounts";
import { getWithdrawalSummaryForDate } from "@/lib/services/db/cashWithdrawals";
import {
  applyTransactionToLedgerSummary,
  getDailyLedgerSummary,
  summaryFromStoredLedgerFields,
  type LedgerTransactionDelta,
} from "@/lib/services/db/dailyLedger";
import type { CashCount, CashWithdrawal, DailyLedgerSummary } from "@/types";

const HISTORY_LIMIT = 60;

export type CashCountPagePayload = {
  businessToday: string;
  today: {
    data: CashCount | null;
    expectedBalance: number;
    openingBalance: number;
    countDate: string;
    isLocked: boolean;
  };
  ledger: DailyLedgerSummary;
  withdrawals: {
    data: CashWithdrawal[];
    totalWithdrawn: number;
    count: number;
  };
  history: CashCount[];
};

function buildTodayPayload(record: CashCount | null, businessToday: string, ledger: DailyLedgerSummary) {
  if (record) {
    return {
      data: record,
      expectedBalance: record.expectedBalance,
      openingBalance: record.openingBalance,
      countDate: record.countDate,
      isLocked: !!record.closedAt,
    };
  }
  return {
    data: null,
    expectedBalance: ledger.cash.closing,
    openingBalance: ledger.cash.opening,
    countDate: businessToday,
    isLocked: false,
  };
}

/** โหลดหน้าปิดยอด — อ่าน snapshot จาก DB ก่อน คำนวณหนักเฉพาะครั้งแรกของวัน */
export async function loadCashCountPageData(organizationId: string): Promise<CashCountPagePayload> {
  const businessToday = getBusinessToday();

  await getDb().rpc("fn_auto_close_cash_counts");

  const [todayRecord, withdrawals, history] = await Promise.all([
    getCashCountByDate(organizationId, businessToday),
    getWithdrawalSummaryForDate(organizationId, businessToday),
    getCashCounts(organizationId, { limit: HISTORY_LIMIT }),
  ]);

  let record = todayRecord;
  let ledger: DailyLedgerSummary | null = record
    ? summaryFromStoredLedgerFields(record, businessToday, businessToday)
    : null;

  if (!record) {
    const cycle = await ensureDailyCashCountCycle(organizationId, { syncLedger: true });
    record = cycle.todayRecord;
    ledger = cycle.ledger ?? ledger;
  }

  if (!ledger) {
    ledger = await getDailyLedgerSummary(organizationId, businessToday);
    if (record && !record.closedAt) {
      await refreshOpenDailyCloseRecord(organizationId, businessToday, ledger);
      record = (await getCashCountByDate(organizationId, businessToday)) ?? record;
    }
  }

  return {
    businessToday,
    today: buildTodayPayload(record, businessToday, ledger),
    ledger,
    withdrawals: {
      data: withdrawals.items,
      totalWithdrawn: withdrawals.totalWithdrawn,
      count: withdrawals.count,
    },
    history,
  };
}

/** หลังบันทึก/ยกเลิกรายการ — อัปเดต snapshot แบบ incremental (เร็ว) */
export async function syncTodayLedgerAfterMutation(
  organizationId: string,
  transactionDate: string,
  transaction?: LedgerTransactionDelta,
  mode: "apply" | "revert" = "apply"
): Promise<void> {
  if (transactionDate !== getBusinessToday()) return;

  let row = await getCashCountByDate(organizationId, transactionDate);
  if (row?.closedAt) return;

  if (!row) {
    await ensureDailyCashCountCycle(organizationId, { syncLedger: true });
    row = await getCashCountByDate(organizationId, transactionDate);
    if (!row || row.closedAt) return;
  }

  const businessToday = getBusinessToday();
  let summary = summaryFromStoredLedgerFields(row, transactionDate, businessToday);

  if (summary && transaction) {
    summary = applyTransactionToLedgerSummary(summary, transaction, mode);
    await refreshOpenDailyCloseRecord(organizationId, transactionDate, summary);
    return;
  }

  const ledger = await getDailyLedgerSummary(organizationId, transactionDate, {
    forceRecalc: true,
  });
  await refreshOpenDailyCloseRecord(organizationId, transactionDate, ledger);
}
