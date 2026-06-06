import { NextResponse } from "next/server";
import { mockReportSummary } from "@/data/mock";

export async function GET() {
  return NextResponse.json({ data: mockReportSummary });
}
