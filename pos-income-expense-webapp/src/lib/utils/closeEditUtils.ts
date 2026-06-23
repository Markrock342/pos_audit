import { getBusinessToday } from "@/lib/utils/businessDate";
import type { CashCount } from "@/types";

export function isInCloseEditMode(count: CashCount | null | undefined): boolean {
  return !!count?.closeEditReopenedAt && !count?.closedAt;
}

export function canReopenCloseForEdit(
  count: CashCount | null | undefined,
  businessToday = getBusinessToday()
): boolean {
  if (!count?.closedAt) return false;
  if (count.countDate !== businessToday) return false;
  if (count.closeEditReopenedAt) return false;
  return true;
}
