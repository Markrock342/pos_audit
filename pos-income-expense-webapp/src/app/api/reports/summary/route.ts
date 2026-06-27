import { NextResponse } from "next/server";
import { getTransactions } from "@/lib/services/db/transactions";
import {
  getReportDefaultEndDate,
  getReportDefaultStartDate,
} from "@/lib/utils/reportDateRange";
import type { ReportSummary } from "@/types";

import { DEFAULT_ORG_ID } from "@/constants/organizations";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start") ?? getReportDefaultStartDate();
  const end = searchParams.get("end") ?? getReportDefaultEndDate();

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

  return NextResponse.json({ data: summary }, { headers: NO_STORE });
}
