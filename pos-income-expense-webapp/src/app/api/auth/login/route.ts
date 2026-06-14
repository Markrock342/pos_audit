import { NextResponse } from "next/server";
import { z } from "zod";
import {
  findKioskAccount,
  toKioskSession,
} from "@/constants/kioskUsers";
import { ensureKioskUser } from "@/lib/services/db/kioskUsers";

const loginSchema = z.object({
  username: z.string().min(1),
  pin: z.string().min(1),
});

export async function POST(request: Request) {
  const raw = await request.json();
  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.format() } },
      { status: 400 }
    );
  }

  const { username, pin } = parsed.data;
  const account = findKioskAccount(username, pin);

  if (!account) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid username or PIN" } },
      { status: 401 }
    );
  }

  const session = toKioskSession(account);

  try {
    await ensureKioskUser(account);
  } catch (err) {
    console.error("[auth/login] ensureKioskUser failed:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "ไม่สามารถเตรียมบัญชีผู้ใช้ได้ — ติดต่อ admin" } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: session });
}
