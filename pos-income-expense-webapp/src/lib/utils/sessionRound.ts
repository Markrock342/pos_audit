import { getCashCountByDate } from "@/lib/services/db/cashCounts";
import { getBusinessToday } from "@/lib/utils/businessDate";
import { isInCloseEditMode } from "@/lib/utils/closeEditUtils";
import type { CashCount, Transaction } from "@/types";

export function canStartNewCloseRound(
  count: CashCount | null | undefined,
  businessToday = getBusinessToday()
): boolean {
  if (!count?.closedAt) return false;
  if (count.countDate !== businessToday) return false;
  if (isInCloseEditMode(count)) return false;
  return true;
}

export async function getCurrentSessionRound(
  organizationId: string,
  countDate: string
): Promise<number> {
  const row = await getCashCountByDate(organizationId, countDate);
  return row?.sessionRound ?? 1;
}

export async function getSessionRoundForNewEntry(
  organizationId: string,
  businessDate: string
): Promise<number> {
  return getCurrentSessionRound(organizationId, businessDate);
}

/** กรองรายการวันนี้ให้เหลือเฉพาะรอบที่กำลังทำงาน — ใช้ dashboard / หน้างาน */
export function filterTodayTransactionsForSession(
  transactions: Transaction[],
  businessToday: string,
  sessionRound: number
): Transaction[] {
  return transactions.filter(
    (t) => t.transactionDate === businessToday && (t.sessionRound ?? 1) === sessionRound
  );
}
