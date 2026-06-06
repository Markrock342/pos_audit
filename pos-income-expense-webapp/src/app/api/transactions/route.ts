import { NextResponse } from "next/server";
import { addTransaction, getTransactions } from "@/lib/store";
import type { Transaction } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const data =
    type === "income" || type === "expense"
      ? getTransactions(type)
      : getTransactions();

  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Omit<Transaction, "id" | "createdAt">;
  const newTransaction = addTransaction(body);

  return NextResponse.json({ data: newTransaction }, { status: 201 });
}
