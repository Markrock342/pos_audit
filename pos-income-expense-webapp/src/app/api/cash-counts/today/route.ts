import { NextResponse } from "next/server";
import {
  getCashCountByDate,
  calculateExpectedBalance,
} from "@/lib/services/db/cashCounts";
import { DEFAULT_ORG_ID } from "@/constants/organizations";

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  const existing = await getCashCountByDate(DEFAULT_ORG_ID, today);

  if (existing) {
    return NextResponse.json({ data: existing });
  }

  // ถ้ายังไม่มี record วันนี้ คำนวณ expectedBalance จาก transactions
  const expectedBalance = await calculateExpectedBalance(
    DEFAULT_ORG_ID,
    today,
    0 // ยังไม่มี openingBalance ให้ใช้ 0 เป็นค่า default
  );

  return NextResponse.json({
    data: null,
    expectedBalance,
    openingBalance: 0,
    countDate: today,
  });
}
