import { NextResponse } from "next/server";
import { getByCategory } from "@/lib/services/db/reports";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start") ?? getFirstDayOfMonth();
  const end = searchParams.get("end") ?? getToday();

  const data = await getByCategory(start, end);
  return NextResponse.json({ data });
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getFirstDayOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}
