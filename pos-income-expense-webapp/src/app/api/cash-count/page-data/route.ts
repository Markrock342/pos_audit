import { NextResponse } from "next/server";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { ensureDailyCashCountCycle, getCashCounts } from "@/lib/services/db/cashCounts";
import { getWithdrawalSummaryForDate } from "@/lib/services/db/cashWithdrawals";
import { getDailyLedgerSummary } from "@/lib/services/db/dailyLedger";

const HISTORY_LIMIT = 60;

/** โหลดหน้าปิดยอดครั้งเดียว — ลด round-trip และ query ซ้ำ */
export async function GET() {
  try {
    const cycle = await ensureDailyCashCountCycle(DEFAULT_ORG_ID);
    const ledger =
      cycle.ledger ??
      (await getDailyLedgerSummary(DEFAULT_ORG_ID, cycle.businessToday));

    const [withdrawals, history] = await Promise.all([
      getWithdrawalSummaryForDate(DEFAULT_ORG_ID, cycle.businessToday),
      getCashCounts(DEFAULT_ORG_ID, { limit: HISTORY_LIMIT }),
    ]);

    const today = cycle.todayRecord;

    return NextResponse.json({
      businessToday: cycle.businessToday,
      today: today
        ? {
            data: today,
            expectedBalance: today.expectedBalance,
            openingBalance: today.openingBalance,
            countDate: today.countDate,
            isLocked: !!today.closedAt,
          }
        : {
            data: null,
            expectedBalance: cycle.expectedBalance,
            openingBalance: cycle.openingBalance,
            countDate: cycle.businessToday,
            isLocked: false,
          },
      ledger,
      withdrawals: {
        data: withdrawals.items,
        totalWithdrawn: withdrawals.totalWithdrawn,
        count: withdrawals.count,
      },
      history,
    });
  } catch (e) {
    console.error("[cash-count/page-data GET]", e);
    return NextResponse.json(
      {
        error: {
          code: "LOAD_ERROR",
          message: e instanceof Error ? e.message : "โหลดหน้าปิดยอดไม่สำเร็จ",
        },
      },
      { status: 500 }
    );
  }
}
