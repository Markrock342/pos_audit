import { NextResponse } from "next/server";
import { ensureDailyCashCountCycle } from "@/lib/services/db/cashCounts";
import { DEFAULT_ORG_ID } from "@/constants/organizations";

export async function GET() {
  try {
    const cycle = await ensureDailyCashCountCycle(DEFAULT_ORG_ID);

    if (cycle.todayRecord) {
      return NextResponse.json({
        data: cycle.todayRecord,
        expectedBalance: cycle.todayRecord.expectedBalance,
        openingBalance: cycle.todayRecord.openingBalance,
        countDate: cycle.todayRecord.countDate,
        businessToday: cycle.businessToday,
        isLocked: !!cycle.todayRecord.closedAt,
      });
    }

    return NextResponse.json({
      data: null,
      expectedBalance: cycle.expectedBalance,
      openingBalance: cycle.openingBalance,
      countDate: cycle.businessToday,
      businessToday: cycle.businessToday,
      isLocked: false,
    });
  } catch (e) {
    console.error("[cash-counts/today]", e);
    return NextResponse.json(
      {
        error: {
          code: "CYCLE_ERROR",
          message:
            e instanceof Error
              ? e.message
              : "โหลดปิดยอดไม่สำเร็จ — ลองรัน docs/supabase-cash-count-close-rls-fix.sql",
        },
      },
      { status: 500 }
    );
  }
}
