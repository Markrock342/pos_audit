import { NextResponse } from "next/server";
import { getDailyLedgerSummary } from "@/lib/services/db/dailyLedger";
import { DEFAULT_ORG_ID } from "@/constants/organizations";

type RouteParams = { params: Promise<{ date: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { date } = await params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)" } },
        { status: 400 }
      );
    }

    const data = await getDailyLedgerSummary(DEFAULT_ORG_ID, date);
    return NextResponse.json({ data });
  } catch (e) {
    console.error("[daily-close/[date] GET]", e);
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
