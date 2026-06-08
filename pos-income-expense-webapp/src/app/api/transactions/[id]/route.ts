import { NextResponse } from "next/server";
import {
  getTransaction,
  updateTransaction,
} from "@/lib/services/db/transactions";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";

const DEFAULT_USER_ID = KIOSK_ACCOUNTS.find((a) => a.type === "customer")!.userId;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const transaction = await getTransaction(id);

  if (!transaction) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Transaction not found" } },
      { status: 404 }
    );
  }

  // ตรวจสอบว่าเป็นรายการของ organization นี้ (MVP: ยังไม่มี auth จริง)
  if (transaction.organizationId && transaction.organizationId !== DEFAULT_ORG_ID) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Access denied" } },
      { status: 403 }
    );
  }

  return NextResponse.json({ data: transaction });
}

export async function PUT(
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
      { error: { code: "INVALID_STATE", message: "Cannot edit a voided transaction" } },
      { status: 400 }
    );
  }

  const updated = await updateTransaction(id, {
    title: body.title,
    amount: Number(body.amount),
    categoryId: body.categoryId,
    paymentMethod: body.paymentMethod,
    transactionDate: body.transactionDate,
    note: body.note,
    referenceNo: body.referenceNo,
    updatedBy: body.updatedBy ?? DEFAULT_USER_ID,
  });

  return NextResponse.json({ data: updated });
}
