import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";
import { PAYMENT_METHODS } from "@/constants";
import type { PaymentMethod, Transaction, TransactionLineItem } from "@/types";

/** จำนวนเงินบนใบเสร็จ — ทศนิยม 2 ตำแหน่ง ไม่มีสัญลักษณ์ ฿ */
export function formatReceiptAmount(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

/** วันที่+เวลาบนใบเสร็จ YYYY-MM-DD HH:mm:ss */
export function formatReceiptDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function resolveReceiptLines(transaction: Transaction): TransactionLineItem[] {
  if (transaction.lineItems && transaction.lineItems.length > 0) {
    return [...transaction.lineItems].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return [
    {
      id: "legacy",
      transactionId: transaction.id,
      sortOrder: 0,
      title: transaction.title,
      quantity: 1,
      unitPrice: transaction.amount,
      lineAmount: transaction.amount,
      categoryId: transaction.categoryId,
    },
  ];
}

export function resolveReceiptNumber(
  transaction: Transaction,
  receiptNumber?: string
): string {
  return resolveDocumentNumber(transaction, "S", receiptNumber);
}

/** เลขที่ใบบันทึกรายจ่าย — prefix P */
export function resolveExpenseVoucherNumber(
  transaction: Transaction,
  voucherNumber?: string
): string {
  return resolveDocumentNumber(transaction, "P", voucherNumber);
}

function resolveDocumentNumber(
  transaction: Transaction,
  prefix: "S" | "P",
  overrideNumber?: string
): string {
  if (overrideNumber?.trim()) return overrideNumber.trim();
  if (transaction.receiptNo?.trim()) return transaction.receiptNo.trim();
  const d = new Date(transaction.createdAt);
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  const suffix = transaction.id.replace(/\D/g, "").slice(-3).padStart(3, "0");
  return `${prefix}${stamp}${suffix}`;
}

/** วันที่รายการต่างจากวันบันทึก — แสดงบนใบบันทึกรายจ่าย */
export function hasDistinctTransactionDate(transaction: Transaction): boolean {
  const txDate = transaction.transactionDate?.slice(0, 10);
  const createdDate = transaction.createdAt.slice(0, 10);
  return !!txDate && txDate !== createdDate;
}

export function resolveSellerName(createdBy: string, fallback = "ผู้ดูแลระบบ"): string {
  const account = KIOSK_ACCOUNTS.find((a) => a.userId === createdBy);
  return account?.displayName ?? fallback;
}

/** ชื่อผู้บันทึกบนใบบันทึกรายจ่าย */
export const resolveRecorderName = resolveSellerName;

export function resolvePaymentLabel(method: PaymentMethod): string {
  return PAYMENT_METHODS.find((p) => p.value === method)?.label ?? method;
}

export function sumLineItems(lines: TransactionLineItem[]): number {
  return lines.reduce((sum, line) => sum + line.lineAmount, 0);
}
