import { NextResponse } from "next/server";
import { getByCategory } from "@/lib/services/db/reports";
import {
  getReportDefaultEndDate,
  getReportDefaultStartDate,
} from "@/lib/utils/reportDateRange";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start") ?? getReportDefaultStartDate();
  const end = searchParams.get("end") ?? getReportDefaultEndDate();

  const data = await getByCategory(start, end);
  return NextResponse.json({ data }, { headers: NO_STORE });
}
