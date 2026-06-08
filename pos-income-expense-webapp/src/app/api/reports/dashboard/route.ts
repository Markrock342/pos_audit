import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/services/db/reports";

export async function GET() {
  const data = await getDashboard();
  return NextResponse.json({ data });
}
