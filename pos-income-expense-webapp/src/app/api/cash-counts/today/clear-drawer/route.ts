import { NextResponse } from "next/server";
import { z } from "zod";
import { clearDrawerAndCloseDay } from "@/lib/services/db/cashCounts";
import { getBusinessToday } from "@/lib/utils/businessDate";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";
import { ensureKioskUserById } from "@/lib/services/db/kioskUsers";

const DEFAULT_USER_ID = KIOSK_ACCOUNTS.find((a) => a.type === "customer")!.userId;

const postSchema = z.object({
  actualBalance: z.coerce.number().min(0).optional(),
  note: z.string().max(500).optional(),
  recordedBy: z.string().optional(),
  updatedBy: z.string().optional(),
});

export async function POST(request: Request) {
  const raw = await request.json().catch(() => ({}));
  const parsed = postSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.format() } },
      { status: 400 }
    );
  }

  const businessToday = getBusinessToday();
  const recordedBy = parsed.data.recordedBy ?? DEFAULT_USER_ID;
  await ensureKioskUserById(recordedBy);

  try {
    const result = await clearDrawerAndCloseDay(DEFAULT_ORG_ID, {
      actualBalance: parsed.data.actualBalance,
      note: parsed.data.note,
      recordedBy,
      updatedBy: parsed.data.updatedBy ?? recordedBy,
    });

    return NextResponse.json({
      data: {
        ...result,
        businessToday,
        message: "เคลียร์ลิ้นชักและปิดวันแล้ว — พรุ่งนี้ใส่เงินทอนใหม่",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "เคลียร์ลิ้นชักไม่สำเร็จ";
    const status = message.includes("ปิดยอดแล้ว") ? 403 : 400;
    console.error("[cash-counts/today/clear-drawer POST]", e);
    return NextResponse.json(
      { error: { code: status === 403 ? "LOCKED" : "CLEAR_ERROR", message } },
      { status }
    );
  }
}
