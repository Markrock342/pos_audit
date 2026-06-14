import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCashCounts,
  getCashCountByDate,
  createCashCount,
  ensureDailyCashCountCycle,
  isCashCountLocked,
} from "@/lib/services/db/cashCounts";
import { getBusinessToday } from "@/lib/utils/businessDate";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";
import { ensureKioskUserById } from "@/lib/services/db/kioskUsers";

const DEFAULT_USER_ID = KIOSK_ACCOUNTS.find((a) => a.type === "customer")!.userId;

const postSchema = z.object({
  countDate: z.string().min(1),
  openingBalance: z.coerce.number().min(0),
  actualBalance: z.coerce.number().min(0),
  note: z.string().max(500).optional(),
  countedBy: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "รูปแบบวันที่ไม่ถูกต้อง" } },
          { status: 400 }
        );
      }
      const row = await getCashCountByDate(DEFAULT_ORG_ID, date);
      return NextResponse.json({ data: row });
    }
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Number(limitParam) || 60, 120) : undefined;
    const data = await getCashCounts(DEFAULT_ORG_ID, limit ? { limit } : undefined);
    return NextResponse.json({ data, total: data.length });
  } catch (e) {
    console.error("[cash-counts GET]", e);
    return NextResponse.json(
      { error: { code: "CYCLE_ERROR", message: e instanceof Error ? e.message : "Load failed" } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const raw = await request.json();
  const parsed = postSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.format() } },
      { status: 400 }
    );
  }

  const businessToday = getBusinessToday();
  if (parsed.data.countDate !== businessToday) {
    return NextResponse.json(
      { error: { code: "DATE_LOCKED", message: "บันทึกได้เฉพาะวันปัจจุบันเท่านั้น" } },
      { status: 403 }
    );
  }

  await ensureDailyCashCountCycle(DEFAULT_ORG_ID);
  const existing = await getCashCountByDate(DEFAULT_ORG_ID, businessToday);

  if (existing && isCashCountLocked(existing, businessToday)) {
    return NextResponse.json(
      { error: { code: "LOCKED", message: "วันนี้ปิดยอดแล้ว — แก้ไขไม่ได้" } },
      { status: 403 }
    );
  }

  const body = parsed.data;
  const countedBy = body.countedBy ?? DEFAULT_USER_ID;
  await ensureKioskUserById(countedBy);

  if (existing) {
    return NextResponse.json(
      {
        error: {
          code: "ALREADY_EXISTS",
          message: "มี record วันนี้แล้ว — ใช้ PUT อัปเดต",
        },
      },
      { status: 409 }
    );
  }

  const newCashCount = await createCashCount({
    organizationId: DEFAULT_ORG_ID,
    countedBy,
    countDate: body.countDate,
    openingBalance: body.openingBalance,
    actualBalance: body.actualBalance,
    note: body.note,
  });

  return NextResponse.json({ data: newCashCount }, { status: 201 });
}
