import { NextResponse } from "next/server";
import {
  getCashCounts,
  createCashCount,
} from "@/lib/services/db/cashCounts";

const DEFAULT_ORG_ID = "default-org"; // MVP: single organization

export async function GET() {
  const data = await getCashCounts(DEFAULT_ORG_ID);
  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: Request) {
  const body = await request.json();
  const newCashCount = await createCashCount({
    ...body,
    organizationId: DEFAULT_ORG_ID,
  });

  return NextResponse.json({ data: newCashCount }, { status: 201 });
}
