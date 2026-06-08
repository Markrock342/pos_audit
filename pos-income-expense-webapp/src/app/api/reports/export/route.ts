import { NextResponse } from "next/server";
import { getTransactions } from "@/lib/services/db/transactions";
import { getCategories } from "@/lib/services/db/categories";
import { transactionsToCsv } from "@/lib/utils/csvExport";
import { DEFAULT_ORG_ID } from "@/constants/organizations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start") ?? getFirstDayOfMonth();
  const end = searchParams.get("end") ?? getToday();

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
    },
  });
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getFirstDayOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}
