import { BUSINESS_TIMEZONE } from "@/lib/utils/businessDate";
import type { AuditLog } from "@/types";

/** วันธุรกิจของรายการ audit — ใช้กรองประวัติตามวันที่รายการ ไม่ใช่แค่ created_at */
export function getAuditLogBusinessDate(log: AuditLog): string {
  const payload = log.newValue ?? log.oldValue ?? {};

  if (log.entityType === "transaction" && payload.transactionDate) {
    return String(payload.transactionDate).slice(0, 10);
  }
  if (log.entityType === "cash_deposit" && payload.depositDate) {
    return String(payload.depositDate).slice(0, 10);
  }
  if (log.entityType === "cash_withdrawal" && payload.withdrawalDate) {
    return String(payload.withdrawalDate).slice(0, 10);
  }

  return new Date(log.createdAt).toLocaleDateString("en-CA", { timeZone: BUSINESS_TIMEZONE });
}

export function isAuditLogInBusinessDateRange(
  log: AuditLog,
  startDate?: string,
  endDate?: string
): boolean {
  if (!startDate && !endDate) return true;
  const businessDate = getAuditLogBusinessDate(log);
  if (startDate && businessDate < startDate) return false;
  if (endDate && businessDate > endDate) return false;
  return true;
}

export function filterAuditLogsByBusinessDate(
  logs: AuditLog[],
  startDate?: string,
  endDate?: string
): AuditLog[] {
  if (!startDate && !endDate) return logs;
  return logs.filter((log) => isAuditLogInBusinessDateRange(log, startDate, endDate));
}

/** รอบการทำงานของ audit — ใช้กรองประวัติรายรับ/รายจ่ายตามรอบ */
export function getAuditLogSessionRound(log: AuditLog): number {
  const value = log.newValue?.sessionRound ?? log.oldValue?.sessionRound;
  return typeof value === "number" ? value : 1;
}
