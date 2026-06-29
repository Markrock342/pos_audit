import { NextResponse } from "next/server";
import { z } from "zod";
import { reopenCloseForEdit } from "@/lib/services/db/closeEdit";
import { getBusinessToday } from "@/lib/utils/businessDate";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";
import { ensureKioskUserById } from "@/lib/services/db/kioskUsers";

const DEFAULT_USER_ID = KIOSK_ACCOUNTS.find((a) => a.type === "customer")!.userId;

const postSchema = z.object({
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
  const userId = parsed.data.updatedBy ?? DEFAULT_USER_ID;
  await ensureKioskUserById(userId);

  try {
    const result = await reopenCloseForEdit(DEFAULT_ORG_ID, {
      userId,
      countDate: businessToday,
    });

    if (result.alreadyOpen) {
      return NextResponse.json({
        data: {
          ...result,
          businessToday,
          message: "เปิดแก้ไขปิดยอดแล้ว — แก้ไขรายการได้ แล้วกดปิดยอดใหม่เมื่อเสร็จ",
        },
      });
    }

    return NextResponse.json({
      data: {
        ...result,
        businessToday,
        message: "เปิดแก้ไขปิดยอดแล้ว — แก้ไขรายการได้ แล้วกดปิดยอดใหม่เมื่อเสร็จ",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "เปิดแก้ไขปิดยอดไม่สำเร็จ";
    const status =
      message.includes("ปิดยอด") ||
      message.includes("วันนี้") ||
      message.includes("SQL")
        ? 403
        : 400;
    console.error("[cash-counts/today/reopen-for-edit POST]", e);
    return NextResponse.json(
      { error: { code: status === 403 ? "FORBIDDEN" : "REOPEN_ERROR", message } },
      { status }
    );
  }
}
