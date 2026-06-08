import type { Transaction } from "@/types";

/** ฟิลด์ที่เก็บใน audit_logs.old_value / new_value สำหรับ transaction */
export function transactionAuditSnapshot(
  t: Transaction
): Record<string, unknown> {
  return {
    title: t.title,
    amount: t.amount,
    categoryId: t.categoryId,
    paymentMethod: t.paymentMethod,
    transactionDate: t.transactionDate,
    note: t.note ?? null,
    referenceNo: t.referenceNo ?? null,
    type: t.type,
    status: t.status,
    voidReason: t.voidReason ?? null,
  };
}
