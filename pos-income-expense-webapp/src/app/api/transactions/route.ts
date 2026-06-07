import { NextResponse } from "next/server";
import {
  getTransactions,
  createTransaction,
} from "@/lib/services/db/transactions";
import type { Transaction } from "@/types";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";

const DEFAULT_USER_ID = KIOSK_ACCOUNTS.find((a) => a.type === "customer")!.userId;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as Transaction["type"] | null;
  const status = searchParams.get("status") as Transaction["status"] | null;
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;

  const data = await getTransactions(DEFAULT_ORG_ID, {
    type: type ?? undefined,
    status: status ?? undefined,
    startDate,
    endDate,
  });

  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: Request) {
  const body = await request.json();
  const newTransaction = await createTransaction({
    type: body.type,
    categoryId: body.categoryId,
    title: body.title,
    amount: Number(body.amount),
    note: body.note,
    paymentMethod: body.paymentMethod,
    referenceNo: body.referenceNo,
    transactionDate: body.transactionDate ?? body.date ?? new Date().toISOString().slice(0, 10),
    createdBy: body.createdBy ?? DEFAULT_USER_ID,
    organizationId: DEFAULT_ORG_ID,
  });

  return NextResponse.json({ data: newTransaction }, { status: 201 });
}
