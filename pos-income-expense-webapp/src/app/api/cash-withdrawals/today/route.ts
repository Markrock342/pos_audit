import { NextResponse } from "next/server";
import { getWithdrawalSummaryForDate } from "@/lib/services/db/cashWithdrawals";
import { getBusinessToday } from "@/lib/utils/businessDate";
import { DEFAULT_ORG_ID } from "@/constants/organizations";

export async function GET() {
  try {
    const businessToday = getBusinessToday();
    const summary = await getWithdrawalSummaryForDate(DEFAULT_ORG_ID, businessToday);

    return NextResponse.json({
      businessToday,
      totalWithdrawn: summary.totalWithdrawn,
      count: summary.count,
      data: summary.items,
    });
  } catch (e) {
    console.error("[cash-withdrawals/today GET]", e);
    const message = e instanceof Error ? e.message : "โหลดถอนวันนี้ไม่สำเร็จ";
    const isMissingTable =
      message.includes("cash_withdrawals") ||
      message.includes("does not exist") ||
      message.includes("Could not find");

    return NextResponse.json(
      {
        error: {
          code: isMissingTable ? "MIGRATION_REQUIRED" : "LOAD_ERROR",
          message: isMissingTable
            ? "ยังไม่มีตาราง cash_withdrawals — รัน docs/supabase-cash-withdrawals.sql ใน Supabase"
            : message,
        },
      },
      { status: isMissingTable ? 503 : 500 }
    );
  }
}
