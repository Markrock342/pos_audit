import { NextResponse } from "next/server";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { loadCashCountPageData } from "@/lib/services/db/cashCountPage";

export const dynamic = "force-dynamic";

/** โหลดหน้าปิดยอดครั้งเดียว — อ่าน snapshot จาก DB + parallel queries */
export async function GET() {
  try {
    const data = await loadCashCountPageData(DEFAULT_ORG_ID);
    return NextResponse.json(data);
  } catch (e) {
    console.error("[cash-count/page-data GET]", e);
    return NextResponse.json(
      {
        error: {
          code: "LOAD_ERROR",
          message: e instanceof Error ? e.message : "โหลดหน้าปิดยอดไม่สำเร็จ",
        },
      },
      { status: 500 }
    );
  }
}
