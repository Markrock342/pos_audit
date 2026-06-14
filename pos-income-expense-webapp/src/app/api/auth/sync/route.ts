import { NextResponse } from "next/server";
import { z } from "zod";
import { KIOSK_ACCOUNTS, toKioskSession } from "@/constants/kioskUsers";
import { ensureKioskUser } from "@/lib/services/db/kioskUsers";

const syncSchema = z.object({
  username: z.string().min(1),
});

/** sync แถว users ใน DB + คืน session ล่าสุด (ชื่อ/role จาก config) */
export async function POST(request: Request) {
  try {
    const parsed = syncSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.format() } },
        { status: 400 }
      );
    }

    const account = KIOSK_ACCOUNTS.find((a) => a.username === parsed.data.username.trim());
    if (!account) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Unknown kiosk account" } },
        { status: 404 }
      );
    }

    await ensureKioskUser(account);
    return NextResponse.json({ data: toKioskSession(account) });
  } catch (err) {
    console.error("[auth/sync] failed:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "ไม่สามารถ sync บัญชีผู้ใช้ได้" } },
      { status: 500 }
    );
  }
}
