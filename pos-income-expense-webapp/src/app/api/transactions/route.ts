import { NextResponse } from "next/server";
import { mockTransactions } from "@/data/mock";
import type { Transaction } from "@/types";

let transactions = [...mockTransactions];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const data =
    type === "income" || type === "expense"
      ? transactions.filter((t) => t.type === type)
      : transactions;

  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Omit<Transaction, "id" | "createdAt">;

  const newTransaction: Transaction = {
    ...body,
    id: `txn-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  transactions = [newTransaction, ...transactions];

  return NextResponse.json({ data: newTransaction }, { status: 201 });
}
