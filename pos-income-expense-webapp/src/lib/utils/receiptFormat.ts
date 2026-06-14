import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";
import { getPaymentMethodLabel } from "@/constants";
import type { PaymentMethod, Transaction, TransactionLineItem } from "@/types";

/** จำนวนเงินบนใบเสร็จ — ทศนิยม 2 ตำแหน่ง มีคั่นหลัก เช่น 1,000.00 */
export function formatReceiptAmount(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** วันที่+เวลาบนใบเสร็จ YYYY-MM-DD HH:mm:ss */
export function formatReceiptDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function resolveReceiptLines(transaction: Transaction): TransactionLineItem[] {
  if (transaction.lineItems) {
    if (transaction.lineItems.length === 0) return [];
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
  return getPaymentMethodLabel(method);
}

export function sumLineItems(lines: TransactionLineItem[]): number {
  return lines.reduce((sum, line) => sum + line.lineAmount, 0);
}

/** รายการเคยแก้ไขหลังบันทึกครั้งแรก */
export function isEditedTransaction(transaction: Transaction): boolean {
  if (!transaction.updatedAt?.trim()) return false;
  if (!transaction.createdAt?.trim()) return true;
  return transaction.updatedAt !== transaction.createdAt;
}

export function resolveDocumentTitle(
  type: Transaction["type"],
  isRevision: boolean
): { title: string; titleEn: string } {
  if (type === "income") {
    return isRevision
      ? { title: "ใบเสร็จรับเงิน (ฉบับแก้ไข)", titleEn: "RECEIPT (REVISED)" }
      : { title: "ใบเสร็จรับเงิน", titleEn: "RECEIPT" };
  }
  return isRevision
    ? { title: "ใบบันทึกรายจ่าย (ฉบับแก้ไข)", titleEn: "EXPENSE (REVISED)" }
    : { title: "ใบบันทึกรายจ่าย", titleEn: "EXPENSE" };
}

export function formatRevisionMetaLines(revisedAt?: string, editReason?: string): string[] {
  const lines: string[] = [];
  if (revisedAt?.trim()) {
    lines.push(`แก้ไขเมื่อ: ${formatReceiptDateTime(revisedAt)}`);
  }
  const reason = editReason?.trim();
  if (reason) {
    lines.push(`เหตุผล: ${reason.length > 80 ? `${reason.slice(0, 77)}...` : reason}`);
  }
  return lines;
}
