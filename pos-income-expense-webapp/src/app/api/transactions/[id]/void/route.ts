import { NextResponse } from "next/server";
import {
  getTransaction,
  voidTransaction,
} from "@/lib/services/db/transactions";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";

const DEFAULT_USER_ID = KIOSK_ACCOUNTS.find((a) => a.type === "customer")!.userId;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await getTransaction(id);
  if (!existing) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Transaction not found" } },
      { status: 404 }
    );
  }

  if (existing.status === "void") {
    return NextResponse.json(
      { error: { code: "INVALID_STATE", message: "Transaction is already voided" } },
      { status: 400 }
    );
  }

  if (!body.voidReason || body.voidReason.trim().length === 0) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "voidReason is required" } },
      { status: 400 }
    );
  }

  const voided = await voidTransaction(
    id,
    body.voidReason,
    body.voidedBy ?? DEFAULT_USER_ID
  );

  return NextResponse.json({ data: voided });
}
