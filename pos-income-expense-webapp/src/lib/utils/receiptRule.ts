import { formatReceiptDateTime } from "@/lib/utils/receiptFormat";

/** ความกว้างใบเสร็จ 80mm (ตัวอักษร monospace) */
export const RECEIPT_RULE_WIDTH = 48;
export const RECEIPT_RULE_CHAR = "-";
export const RECEIPT_TOTAL_RULE_CHAR = "=";

/** คอลัมน์: รายการ | จำนวน | รวม */
export const RECEIPT_ITEM_COL = { name: 26, qty: 6, amount: 16 } as const;

export function receiptRuleLine(): string {
  return RECEIPT_RULE_CHAR.repeat(RECEIPT_RULE_WIDTH);
}

export function receiptTotalRuleLine(): string {
  return RECEIPT_TOTAL_RULE_CHAR.repeat(RECEIPT_RULE_WIDTH);
}

export function splitReceiptDateTime(iso: string): { date: string; time: string } {
  const formatted = formatReceiptDateTime(iso);
  const space = formatted.indexOf(" ");
  if (space === -1) return { date: formatted, time: "-" };
  return { date: formatted.slice(0, space), time: formatted.slice(space + 1) };
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)) + "…";
}

/** แถว meta 2 คอลัมน์ */
export function formatReceiptMetaPair(left: string, right: string): string {
  const maxLeft = 22;
  const maxRight = 22;
  const l = truncate(left, maxLeft);
  const r = truncate(right, maxRight);
  const gap = Math.max(1, RECEIPT_RULE_WIDTH - l.length - r.length);
  return l + " ".repeat(gap) + r;
}

/** แถวตาราง 3 คอลัมน์ — รายการ | จำนวน | รวม */
export function formatReceiptItemRow(item: string, qty: string, amount: string): string {
  const name = truncate(item, RECEIPT_ITEM_COL.name).padEnd(RECEIPT_ITEM_COL.name);
  const q = truncate(qty, RECEIPT_ITEM_COL.qty).padStart(RECEIPT_ITEM_COL.qty);
  const amt = truncate(amount, RECEIPT_ITEM_COL.amount).padStart(RECEIPT_ITEM_COL.amount);
  return name + q + amt;
}

export const RECEIPT_ITEM_HEADER = formatReceiptItemRow("รายการ", "จำนวน", "รวม");

export function formatReceiptSubLine(text: string): string {
  return `  ${truncate(text, RECEIPT_RULE_WIDTH - 2)}`;
}

/** แถวสรุป label + value */
export function formatReceiptSummaryRow(label: string, value: string): string {
  const maxLabel = 22;
  const maxValue = RECEIPT_RULE_WIDTH - maxLabel - 1;
  const l = truncate(label, maxLabel);
  const v = truncate(value, maxValue);
  const gap = Math.max(1, RECEIPT_RULE_WIDTH - l.length - v.length);
  return l + " ".repeat(gap) + v;
}
