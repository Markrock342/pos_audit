import { NextResponse } from "next/server";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { getCategories } from "@/lib/services/db/categories";
import { getCashCountByDate } from "@/lib/services/db/cashCounts";
import { isTodayWorkspaceClosedFromCashCount } from "@/lib/services/db/workspaceStatus";
import { getTransactions } from "@/lib/services/db/transactions";
import { isInCloseEditMode } from "@/lib/utils/closeEditUtils";
import { getBusinessToday } from "@/lib/utils/businessDate";
import type { TransactionType } from "@/types";

export const dynamic = "force-dynamic";

/** โหลดหน้ารายรับ/รายจ่ายครั้งเดียว — ลด round-trip และ query ซ้ำ */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type !== "income" && type !== "expense") {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "type must be income or expense" } },
      { status: 400 }
    );
  }

  try {
    const today = getBusinessToday();
    const [cashCount, transactions, categories] = await Promise.all([
      getCashCountByDate(DEFAULT_ORG_ID, today),
      getTransactions(
        DEFAULT_ORG_ID,
        {
          type: type as TransactionType,
          status: "active",
          startDate: today,
          endDate: today,
        },
        { includeLineItems: false }
      ),
      getCategories(DEFAULT_ORG_ID, type as TransactionType),
    ]);

    const dayCleared = isTodayWorkspaceClosedFromCashCount(cashCount, today);
    const inCloseEditMode = isInCloseEditMode(cashCount);
    const sessionRound = dayCleared ? undefined : (cashCount?.sessionRound ?? 1);

    const filteredTransactions =
      sessionRound != null
        ? transactions.filter((t) => (t.sessionRound ?? 1) === sessionRound)
        : transactions;

    return NextResponse.json(
      {
        data: {
          transactions: dayCleared ? [] : filteredTransactions,
          categories,
          dayCleared,
          inCloseEditMode,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (e) {
    console.error("[transactions/list-page GET]", e);
    return NextResponse.json(
      {
        error: {
          code: "LOAD_ERROR",
          message: e instanceof Error ? e.message : "โหลดรายการไม่สำเร็จ",
        },
      },
      { status: 500 }
    );
  }
}
