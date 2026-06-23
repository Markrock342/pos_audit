import { NextResponse } from "next/server";
import { getCloseHistoryForDate } from "@/lib/services/db/closeEdit";
import { DEFAULT_ORG_ID } from "@/constants/organizations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "ต้องระบุ date รูปแบบ YYYY-MM-DD" } },
      { status: 400 }
    );
  }

  try {
    const data = await getCloseHistoryForDate(DEFAULT_ORG_ID, date);
    return NextResponse.json({ data });
  } catch (e) {
    console.error("[cash-counts/close-events GET]", e);
    return NextResponse.json(
      {
        error: {
          code: "LOAD_ERROR",
          message: e instanceof Error ? e.message : "โหลดประวัติปิดยอดไม่สำเร็จ",
        },
      },
      { status: 500 }
    );
  }
}
