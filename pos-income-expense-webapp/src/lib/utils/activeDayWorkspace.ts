import type { DailyLedgerSummary } from "@/types";

/** หน้ารายรับ/รายจ่ายวันนี้ถูกเคลียร์หลังปิดยอด (ยังไม่เปิดแก้ไข) */
export function isTodayWorkspaceCleared(ledger: DailyLedgerSummary | null): boolean {
  if (!ledger?.businessToday) return false;
  if (ledger.countDate !== ledger.businessToday) return false;
  return !!ledger.closedAt && !!ledger.isLocked;
}
