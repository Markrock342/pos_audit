import { NextResponse } from "next/server";
import { ensureDailyCashCountCycle } from "@/lib/services/db/cashCounts";
import { getDailyLedgerSummary } from "@/lib/services/db/dailyLedger";
import { getBusinessToday } from "@/lib/utils/businessDate";
import { DEFAULT_ORG_ID } from "@/constants/organizations";

export async function GET() {
  try {
    const businessToday = getBusinessToday();
    await ensureDailyCashCountCycle(DEFAULT_ORG_ID);
    const data = await getDailyLedgerSummary(DEFAULT_ORG_ID, businessToday);
    return NextResponse.json({ data });
  } catch (e) {
    console.error("[daily-close/today GET]", e);
    return NextResponse.json(
      {
        error: {
          code: "LOAD_ERROR",
          message: e instanceof Error ? e.message : "โหลดสรุปปิดยอดไม่สำเร็จ",
        },
      },
      { status: 500 }
    );
  }
}
