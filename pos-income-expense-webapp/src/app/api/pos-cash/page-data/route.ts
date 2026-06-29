import { NextResponse } from "next/server";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { loadPosCashPageData } from "@/lib/services/db/posCashPage";

export const dynamic = "force-dynamic";

/** โหลดหน้าเงินสดใน POS ครั้งเดียว — สถานะปิดยอด + ฝาก/ถอนวันนี้ */
export async function GET() {
  try {
    const data = await loadPosCashPageData(DEFAULT_ORG_ID);
    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (e) {
    console.error("[pos-cash/page-data GET]", e);
    return NextResponse.json(
      {
        error: {
          code: "LOAD_ERROR",
          message: e instanceof Error ? e.message : "โหลดหน้าเงินสดใน POS ไม่สำเร็จ",
        },
      },
      { status: 500 }
    );
  }
}
