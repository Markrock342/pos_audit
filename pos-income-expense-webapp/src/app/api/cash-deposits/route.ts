import { NextResponse } from "next/server";
import { z } from "zod";
import { createCashDeposit, getCashDeposits } from "@/lib/services/db/cashDeposits";
import {
  ensureTodayCashCountRecord,
  refreshExpectedBalanceQuick,
} from "@/lib/services/db/cashCounts";
import { safeCreateAuditLog } from "@/lib/services/db/safeAuditLog";
import { withCloseEditAuditMeta } from "@/lib/services/db/closeEdit";
import { assertTransactionDateAllowed } from "@/lib/api/transactionDateLock";
import { isAdminRequest } from "@/lib/api/requestRole";
import { getBusinessToday } from "@/lib/utils/businessDate";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";
import { ensureKioskUserById } from "@/lib/services/db/kioskUsers";

const DEFAULT_USER_ID = KIOSK_ACCOUNTS.find((a) => a.type === "customer")!.userId;
const DEPOSIT_AUDIT_REASON = "ฝากเงินสดเข้า POS";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;
    const depositDate = searchParams.get("depositDate") ?? undefined;

    const data = await getCashDeposits(DEFAULT_ORG_ID, {
      startDate,
      endDate,
      depositDate,
    });

    const totalDeposited = data.reduce((sum, row) => sum + row.amount, 0);

    return NextResponse.json({
      data,
      total: data.length,
      totalDeposited,
    });
  } catch (e) {
    console.error("[cash-deposits GET]", e);
    return NextResponse.json(
      {
        error: {
          code: "LOAD_ERROR",
          message: e instanceof Error ? e.message : "โหลดประวัติฝากไม่สำเร็จ",
        },
      },
      { status: 500 }
    );
  }
}

const postSchema = z.object({
  depositDate: z.string().min(1).optional(),
  amount: z.coerce.number().positive(),
  recordedBy: z.string().optional(),
});

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
    const depositDate = parsed.data.depositDate ?? businessToday;
    const isAdmin = isAdminRequest(request);

    if (depositDate !== businessToday && !isAdmin) {
      return NextResponse.json(
        { error: { code: "DATE_LOCKED", message: "บันทึกฝากได้เฉพาะวันปัจจุบัน" } },
        { status: 403 }
      );
    }

    const dateBlocked = await assertTransactionDateAllowed(depositDate, isAdmin);
    if (dateBlocked) return dateBlocked;

    await ensureTodayCashCountRecord(DEFAULT_ORG_ID);

    const recordedBy = parsed.data.recordedBy ?? DEFAULT_USER_ID;
    await ensureKioskUserById(recordedBy);

    const created = await createCashDeposit({
      organizationId: DEFAULT_ORG_ID,
      depositDate,
      amount: parsed.data.amount,
      recordedBy,
    });

    await safeCreateAuditLog(
      await withCloseEditAuditMeta(DEFAULT_ORG_ID, depositDate, {
        organizationId: DEFAULT_ORG_ID,
        userId: recordedBy,
        entityType: "cash_deposit",
        entityId: created.id,
        entityTitle: "ฝากเงินสด",
        action: "create",
        reason: DEPOSIT_AUDIT_REASON,
        newValue: {
          amount: created.amount,
          depositDate: created.depositDate,
          sessionRound: created.sessionRound,
        },
      })
    );

    await refreshExpectedBalanceQuick(DEFAULT_ORG_ID, depositDate);

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (e) {
    console.error("[cash-deposits POST]", e);
    const message = e instanceof Error ? e.message : "บันทึกฝากไม่สำเร็จ";
    const isMissingTable =
      message.includes("cash_deposits") ||
      message.includes("does not exist") ||
      message.includes("Could not find");

    return NextResponse.json(
      {
        error: {
          code: isMissingTable ? "MIGRATION_REQUIRED" : "CREATE_ERROR",
          message: isMissingTable
            ? "ยังไม่มีตาราง cash_deposits — รัน docs/supabase-cash-deposits.sql ใน Supabase"
            : message,
        },
      },
      { status: isMissingTable ? 503 : 500 }
    );
  }
}
