import type { DailyCloseStatus } from "@/types";

/** วันนี้ปิดยอดแล้ว (เคลียร์ลิ้นชัก) — หน้าหลักแสดงศูนย์ ประวัติเก็บใน cash_counts */
export function isTodayBusinessClosed(status: DailyCloseStatus): boolean {
  return status.isLocked && !!status.closedAt && !status.inCloseEditMode;
}

export function activeTodayIncome(income: number, status: DailyCloseStatus): number {
  return isTodayBusinessClosed(status) ? 0 : income;
}

export function activeTodayExpense(expense: number, status: DailyCloseStatus): number {
  return isTodayBusinessClosed(status) ? 0 : expense;
}

export function activeCashClosing(closing: number, status: DailyCloseStatus): number {
  return isTodayBusinessClosed(status) ? 0 : closing;
}

export function activeNetTotal(netTotal: number, status: DailyCloseStatus): number {
  return isTodayBusinessClosed(status) ? 0 : netTotal;
}
