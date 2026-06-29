import { NextResponse } from "next/server";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { clearBusinessDay } from "@/lib/services/db/clearBusinessDay";
import { getBusinessToday } from "@/lib/utils/businessDate";

export const dynamic = "force-dynamic";

export async function POST() {
  const businessToday = getBusinessToday();

  try {
    const result = await clearBusinessDay(DEFAULT_ORG_ID, businessToday);

    return NextResponse.json({
      data: {
        ...result,
        businessToday,
        message: `ล้างข้อมูลวันนี้ (${businessToday}) แล้ว — เริ่มบันทึกใหม่ได้`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "ล้างข้อมูลไม่สำเร็จ";
    const status =
      message.includes("วันนี้") || message.includes("SQL") ? 403 : 500;
    console.error("[admin/clear-today POST]", e);
    return NextResponse.json(
      { error: { code: status === 403 ? "FORBIDDEN" : "CLEAR_ERROR", message } },
      { status }
    );
  }
}
