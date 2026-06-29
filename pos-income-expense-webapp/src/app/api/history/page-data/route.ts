import { NextResponse } from "next/server";
import {
  loadHistoryPageData,
  type HistoryPageTab,
} from "@/lib/services/db/historyPageData";
import type { AuditLogAction } from "@/types";

export const dynamic = "force-dynamic";

const VALID_TABS = new Set<HistoryPageTab>(["income", "expense", "pos", "close"]);

/** โหลดหน้าประวัติครั้งเดียวต่อแท็บ — ลด HTTP หลายครั้ง */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") as HistoryPageTab | null;
    const startDate = searchParams.get("startDate") ?? "";
    const endDate = searchParams.get("endDate") ?? "";
    const action = searchParams.get("action") as AuditLogAction | null;

    if (!tab || !VALID_TABS.has(tab)) {
      return NextResponse.json(
        { error: { code: "INVALID_TAB", message: "tab ไม่ถูกต้อง" } },
        { status: 400 }
      );
    }
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: { code: "INVALID_RANGE", message: "ต้องระบุ startDate และ endDate" } },
        { status: 400 }
      );
    }

    const data = await loadHistoryPageData(
      tab,
      startDate,
      endDate,
      action ?? undefined
    );

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (e) {
    console.error("[history/page-data GET]", e);
    return NextResponse.json(
      {
        error: {
          code: "LOAD_ERROR",
          message: e instanceof Error ? e.message : "โหลดประวัติไม่สำเร็จ",
        },
      },
      { status: 500 }
    );
  }
}
