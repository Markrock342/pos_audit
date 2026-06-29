import { NextResponse } from "next/server";
import { getCloseEventsInRange, getCloseHistoryForDate } from "@/lib/services/db/closeEdit";
import { DEFAULT_ORG_ID } from "@/constants/organizations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (startDate && endDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "startDate/endDate ต้องเป็น YYYY-MM-DD" } },
        { status: 400 }
      );
    }
    try {
      const events = await getCloseEventsInRange(DEFAULT_ORG_ID, startDate, endDate);
      return NextResponse.json({ data: { events } });
    } catch (e) {
      console.error("[cash-counts/close-events GET range]", e);
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
