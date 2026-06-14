import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createCashWithdrawal,
  getCashWithdrawals,
} from "@/lib/services/db/cashWithdrawals";
import {
  ensureDailyCashCountCycle,
  refreshOpenCashCountExpected,
} from "@/lib/services/db/cashCounts";
import { assertTransactionDateAllowed } from "@/lib/api/transactionDateLock";
import { isAdminRequest } from "@/lib/api/requestRole";
import { getBusinessToday } from "@/lib/utils/businessDate";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";
import { ensureKioskUserById } from "@/lib/services/db/kioskUsers";

const DEFAULT_USER_ID = KIOSK_ACCOUNTS.find((a) => a.type === "customer")!.userId;

const postSchema = z.object({
  withdrawalDate: z.string().min(1).optional(),
  amount: z.coerce.number().positive(),
  note: z.string().trim().min(1, "กรุณาระบุหมายเหตุ").max(500),
  recordedBy: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;
    const withdrawalDate = searchParams.get("withdrawalDate") ?? undefined;

    const data = await getCashWithdrawals(DEFAULT_ORG_ID, {
      startDate,
      endDate,
      withdrawalDate,
    });

    const totalWithdrawn = data.reduce((sum, row) => sum + row.amount, 0);

    return NextResponse.json({
      data,
      total: data.length,
      totalWithdrawn,
    });
  } catch (e) {
    console.error("[cash-withdrawals GET]", e);
    return NextResponse.json(
      {
        error: {
          code: "LOAD_ERROR",
          message: e instanceof Error ? e.message : "โหลดประวัติถอนไม่สำเร็จ",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = postSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.format() } },
        { status: 400 }
      );
    }

    const businessToday = getBusinessToday();
    const withdrawalDate = parsed.data.withdrawalDate ?? businessToday;
    const isAdmin = isAdminRequest(request);

    if (withdrawalDate !== businessToday && !isAdmin) {
      return NextResponse.json(
        { error: { code: "DATE_LOCKED", message: "บันทึกถอนได้เฉพาะวันปัจจุบัน" } },
        { status: 403 }
      );
    }

    const dateBlocked = await assertTransactionDateAllowed(withdrawalDate, isAdmin);
    if (dateBlocked) return dateBlocked;

    await ensureDailyCashCountCycle(DEFAULT_ORG_ID);

    const recordedBy = parsed.data.recordedBy ?? DEFAULT_USER_ID;
    await ensureKioskUserById(recordedBy);

    const created = await createCashWithdrawal({
      organizationId: DEFAULT_ORG_ID,
      withdrawalDate,
      amount: parsed.data.amount,
      note: parsed.data.note,
      recordedBy,
    });

    await refreshOpenCashCountExpected(DEFAULT_ORG_ID, withdrawalDate);

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    console.error("[cash-withdrawals POST]", e);
    const message = e instanceof Error ? e.message : "บันทึกถอนไม่สำเร็จ";
    const isMissingTable =
      message.includes("cash_withdrawals") ||
      message.includes("does not exist") ||
      message.includes("Could not find");

    return NextResponse.json(
      {
        error: {
          code: isMissingTable ? "MIGRATION_REQUIRED" : "CREATE_ERROR",
          message: isMissingTable
            ? "ยังไม่มีตาราง cash_withdrawals — รัน docs/supabase-cash-withdrawals.sql ใน Supabase"
            : message,
        },
      },
      { status: isMissingTable ? 503 : 500 }
    );
  }
}
