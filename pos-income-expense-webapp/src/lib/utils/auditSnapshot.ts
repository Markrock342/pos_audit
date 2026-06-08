import type { Transaction, TransactionLineItem } from "@/types";

function lineItemSnapshot(item: TransactionLineItem) {
  return {
    title: item.title,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineAmount: item.lineAmount,
    categoryId: item.categoryId,
  };
}

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
    lineItems: (t.lineItems ?? []).map(lineItemSnapshot),
  };
}
