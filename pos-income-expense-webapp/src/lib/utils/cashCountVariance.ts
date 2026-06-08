import type { CashCount, CashCountStatus } from "@/types";

export function getCashCountStatusFromVariance(variance: number): CashCountStatus {
  if (variance === 0) return "balanced";
  if (variance < 0) return "short";
  return "overage";
}

/** ข้อความสถานะ — เน้นการกระทบยอดเงินสด ไม่ใช่กำไร/ขาดทุน */
export const CASH_COUNT_STATUS_LABEL: Record<CashCountStatus, string> = {
  balanced: "ตรงยอด",
  short: "เงินสดขาดจากที่บันทึก",
  overage: "เงินสดเกินจากที่บันทึก",
};

export const CASH_COUNT_PENDING_LABEL = "ยังไม่ได้นับ";

export const CASH_COUNT_VARIANCE_HINT =
  "ส่วนต่าง = ยอดนับจริง − ยอดที่ระบบคาดหวัง · ใช้ตรวจว่าเงินสดตรงกับรายการที่บันทึก (ไม่ใช่กำไร/ขาดทุน)";

export function isCashCountPending(row: Pick<CashCount, "hasManualCount" | "closedAt">): boolean {
  return !row.hasManualCount && !row.closedAt;
}

export function getCashCountDisplayLabel(row: Pick<CashCount, "status" | "hasManualCount" | "closedAt">): string {
  if (isCashCountPending(row)) return CASH_COUNT_PENDING_LABEL;
  return CASH_COUNT_STATUS_LABEL[row.status];
}

export function cashCountStatusBadgeClass(status: CashCountStatus): string {
  if (status === "balanced") return "bg-income-light text-income";
  return "bg-amber-500/15 text-amber-800 dark:text-amber-200";
}

export function cashCountDisplayBadgeClass(
  row: Pick<CashCount, "status" | "hasManualCount" | "closedAt">
): string {
  if (isCashCountPending(row)) return "bg-surface-inset text-text-muted";
  return cashCountStatusBadgeClass(row.status);
}
