import { NextResponse } from "next/server";
import { getDailyChart } from "@/lib/services/db/reports";
import { getBusinessToday, shiftBusinessDate } from "@/lib/utils/businessDate";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? 30);

  const end = getBusinessToday();
  const start = shiftBusinessDate(end, -(days - 1));

  const data = await getDailyChart(start, end);
  return NextResponse.json({ data }, { headers: NO_STORE });
}
