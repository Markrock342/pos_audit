import { NextResponse } from "next/server";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { isBusinessDateClosed } from "@/lib/services/db/cashCounts";
import { isPastBusinessDate } from "@/lib/utils/businessDate";

/** ห้ามบันทึก/แก้/void เมื่อวันนั้นปิดยอดแล้ว (ทุก role รวม admin) */
export async function assertTransactionDateAllowed(
  txDate: string,
  isAdmin: boolean
): Promise<NextResponse | null> {
  if (await isBusinessDateClosed(DEFAULT_ORG_ID, txDate)) {
    return NextResponse.json(
      {
        error: {
          code: "DAY_CLOSED",
          message: "วันนี้ปิดยอดแล้ว — ไม่สามารถบันทึกรายการได้",
        },
      },
      { status: 403 }
    );
  }

  if (isAdmin) return null;

  if (isPastBusinessDate(txDate)) {
    return NextResponse.json(
      {
        error: {
          code: "DATE_LOCKED",
          message: "ไม่สามารถบันทึกย้อนหลังวันที่ปิดยอดแล้ว — ติดต่อ admin",
        },
      },
      { status: 403 }
    );
  }

  return null;
}

/** ตรวจทุกวันที่เกี่ยวข้อง (เช่น วันเดิม + วันใหม่ตอนแก้ไข) */
export async function assertTransactionDatesAllowed(
  dates: string[],
  isAdmin: boolean
): Promise<NextResponse | null> {
  const unique = [...new Set(dates.filter(Boolean))];
  for (const date of unique) {
    const blocked = await assertTransactionDateAllowed(date, isAdmin);
    if (blocked) return blocked;
  }
  return null;
}
