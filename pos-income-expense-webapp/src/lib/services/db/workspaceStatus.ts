import { getCashCountByDate } from "@/lib/services/db/cashCounts";
import { isInCloseEditMode } from "@/lib/utils/closeEditUtils";
import { getBusinessToday } from "@/lib/utils/businessDate";
import type { CashCount } from "@/types";

/** ตรวจว่าหน้ารายรับ/รายจ่ายวันนี้ถูกเคลียร์หลังปิดยอด (query เบา — ไม่ recalc ledger) */
export function isTodayWorkspaceClosedFromCashCount(
  cashCount: CashCount | null | undefined,
  businessToday = getBusinessToday()
): boolean {
  if (!cashCount || cashCount.countDate !== businessToday) return false;
  if (isInCloseEditMode(cashCount)) return false;
  return !!cashCount.closedAt;
}

export async function getTodayWorkspaceClosed(
  organizationId: string,
  businessToday = getBusinessToday()
): Promise<boolean> {
  const cashCount = await getCashCountByDate(organizationId, businessToday);
  return isTodayWorkspaceClosedFromCashCount(cashCount, businessToday);
}
