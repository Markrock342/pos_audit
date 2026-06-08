import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getTransactions,
  createTransaction,
} from "@/lib/services/db/transactions";
import type { Transaction } from "@/types";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";

const DEFAULT_USER_ID = KIOSK_ACCOUNTS.find((a) => a.type === "customer")!.userId;

const postSchema = z.object({
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1),
  title: z.string().min(1).max(100),
  amount: z.coerce.number().positive("amount must be > 0"),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(["cash", "transfer", "cheque", "card", "other"]),
  transactionDate: z.string().min(1).optional(),
  referenceNo: z.string().max(100).optional(),
  createdBy: z.string().optional(),
});

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
  const raw = await request.json();
  const parsed = postSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.format() } },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const newTransaction = await createTransaction({
    type: body.type,
    categoryId: body.categoryId,
    title: body.title,
    amount: body.amount,
    note: body.note,
    paymentMethod: body.paymentMethod,
    referenceNo: body.referenceNo,
    transactionDate: body.transactionDate ?? new Date().toISOString().slice(0, 10),
    createdBy: body.createdBy ?? DEFAULT_USER_ID,
    organizationId: DEFAULT_ORG_ID,
  });

  return NextResponse.json({ data: newTransaction }, { status: 201 });
}
