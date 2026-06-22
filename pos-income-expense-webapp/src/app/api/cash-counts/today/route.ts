import { NextResponse } from "next/server";
import { getTodayCashCountView } from "@/lib/services/db/cashCountPage";
import { DEFAULT_ORG_ID } from "@/constants/organizations";

export async function GET() {
  try {
    const view = await getTodayCashCountView(DEFAULT_ORG_ID);

    if (view.record) {
      return NextResponse.json({
        data: { ...view.record, expectedBalance: view.expectedBalance },
        expectedBalance: view.expectedBalance,
        openingBalance: view.openingBalance,
        countDate: view.record.countDate,
        businessToday: view.businessToday,
        isLocked: view.isLocked,
      });
    }

    return NextResponse.json({
      data: null,
      expectedBalance: view.expectedBalance,
      openingBalance: view.openingBalance,
      countDate: view.businessToday,
      businessToday: view.businessToday,
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
