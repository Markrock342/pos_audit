import { NextResponse } from "next/server";
import { getTransactions } from "@/lib/services/db/transactions";
import type { ReportSummary } from "@/types";

import { DEFAULT_ORG_ID } from "@/constants/organizations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start") ?? getFirstDayOfMonth();
  const end = searchParams.get("end") ?? getToday();

  const transactions = await getTransactions(DEFAULT_ORG_ID, {
    startDate: start,
    endDate: end,
    status: "active",
  });

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const summary: ReportSummary = {
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
    dateRange: { start, end },
  };

  return NextResponse.json({ data: summary });
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getFirstDayOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}
