import { getBusinessToday } from "@/lib/utils/businessDate";

import {

  ensureTodayCashCountRecord,

  getCashCountByDate,

  getCashCounts,

  refreshExpectedBalanceQuick,

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

      expectedBalance: record.closedAt ? record.expectedBalance : ledger.cash.closing,

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



/** โหลดหน้าปิดยอด — 1 รอบ ledger + quick refresh (ไม่ sync ledger เต็ม) */

export async function loadCashCountPageData(organizationId: string): Promise<CashCountPagePayload> {

  const businessToday = getBusinessToday();

  const [todayRecord, withdrawals, history] = await Promise.all([

    getCashCountByDate(organizationId, businessToday),

    getWithdrawalSummaryForDate(organizationId, businessToday),

    getCashCounts(organizationId, { limit: HISTORY_LIMIT }),

  ]);



  let record = todayRecord;



  if (!record) {

    record = await ensureTodayCashCountRecord(organizationId);

  }



  if (record && !record.closedAt) {

    await refreshExpectedBalanceQuick(organizationId, businessToday);

    record = (await getCashCountByDate(organizationId, businessToday)) ?? record;

  }



  const storedLedger =

    record?.closedAt

      ? summaryFromStoredLedgerFields(record, businessToday, businessToday)

      : null;



  const ledger =

    storedLedger ?? (await getDailyLedgerSummary(organizationId, businessToday));



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



/** โหลด snapshot วันนี้ — อ่านอย่างเดียว ไม่ sync ledger (sync หลัง mutation เท่านั้น) */
export async function getTodayCashCountView(organizationId: string) {
  const businessToday = getBusinessToday();
  let record = await getCashCountByDate(organizationId, businessToday);

  if (!record) {
    record = await ensureTodayCashCountRecord(organizationId);
  }

  const storedLedger =
    record &&
    (record.closedAt || record.cashIncome != null || record.totalIncome != null)
      ? summaryFromStoredLedgerFields(record, businessToday, businessToday)
      : null;

  const ledger =
    storedLedger ?? (await getDailyLedgerSummary(organizationId, businessToday));

  const expectedBalance = record?.closedAt ? record.expectedBalance : ledger.cash.closing;

  return {
    businessToday,
    record,
    expectedBalance,
    openingBalance: record?.openingBalance ?? ledger.cash.opening,
    isLocked: !!record?.closedAt,
    ledger,
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

    row = await ensureTodayCashCountRecord(organizationId);

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


