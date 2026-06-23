import { NextResponse } from "next/server";
import { getTodayCashCountView } from "@/lib/services/db/cashCountPage";
import { DEFAULT_ORG_ID } from "@/constants/organizations";

export async function GET() {
  try {
    const view = await getTodayCashCountView(DEFAULT_ORG_ID);
    return NextResponse.json(
      { data: view.ledger },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
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
