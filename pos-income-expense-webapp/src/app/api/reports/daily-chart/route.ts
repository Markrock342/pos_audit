import { NextResponse } from "next/server";
import { getDailyChart } from "@/lib/services/db/reports";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? 30);

  const end = getToday();
  const start = getDateDaysAgo(days);

  const data = await getDailyChart(start, end);
  return NextResponse.json({ data });
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
