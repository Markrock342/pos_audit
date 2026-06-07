import { NextResponse } from "next/server";
import {
  getTransactions,
  createTransaction,
} from "@/lib/services/db/transactions";
import type { Transaction } from "@/types";

const DEFAULT_ORG_ID = "default-org"; // MVP: single organization

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
    ...body,
    organizationId: DEFAULT_ORG_ID,
  });

  return NextResponse.json({ data: newTransaction }, { status: 201 });
}
