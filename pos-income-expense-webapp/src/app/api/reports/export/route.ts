import { NextResponse } from "next/server";
import { getTransactions } from "@/lib/services/db/transactions";
import { getCategories } from "@/lib/services/db/categories";
import { transactionsToCsv } from "@/lib/utils/csvExport";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import {
  getReportDefaultEndDate,
  getReportDefaultStartDate,
} from "@/lib/utils/reportDateRange";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start") ?? getReportDefaultStartDate();
  const end = searchParams.get("end") ?? getReportDefaultEndDate();

  const transactions = await getTransactions(DEFAULT_ORG_ID, {
    startDate: start,
    endDate: end,
  });

  const categories = await getCategories(DEFAULT_ORG_ID);
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

  const csv = transactionsToCsv(transactions, categoryNames);
  const filename = `report_${start}_${end}.csv`;

  return new NextResponse("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
