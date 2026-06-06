import { NextResponse } from "next/server";
import { getReportSummary } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ data: getReportSummary() });
}
