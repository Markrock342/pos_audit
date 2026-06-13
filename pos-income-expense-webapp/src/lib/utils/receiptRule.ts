import { formatReceiptDateTime } from "@/lib/utils/receiptFormat";

/**
 * 80mm thermal — Font A / iMin 576 dots
 * รวมความกว้างคอลัมน์ = RECEIPT_RULE_WIDTH (48 หน่วยตัวอักษร)
 */
export const RECEIPT_RULE_WIDTH = 48;
export const RECEIPT_RULE_CHAR = "-";
export const RECEIPT_TOTAL_RULE_CHAR = "=";

/** คอลัมน์ตาราง: รายการ | จำนวน | รวม */
export const RECEIPT_ITEM_COL = { name: 26, qty: 6, amount: 16 } as const;
export const RECEIPT_ITEM_COL_WIDTHS = [
  RECEIPT_ITEM_COL.name,
  RECEIPT_ITEM_COL.qty,
  RECEIPT_ITEM_COL.amount,
] as const;

/** คอลัมน์ meta 2 ฝั่ง */
export const RECEIPT_META_COL = { left: 24, right: 24 } as const;
export const RECEIPT_META_COL_WIDTHS = [
  RECEIPT_META_COL.left,
  RECEIPT_META_COL.right,
] as const;

/** คอลัมน์สรุปยอด */
export const RECEIPT_SUMMARY_COL = { label: 20, value: 28 } as const;
export const RECEIPT_SUMMARY_COL_WIDTHS = [
  RECEIPT_SUMMARY_COL.label,
  RECEIPT_SUMMARY_COL.value,
] as const;

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

/** แถว meta 2 คอลัมน์ (ESC/POS fixed-width) */
export function formatReceiptMetaPair(left: string, right: string): string {
  const l = truncate(left, RECEIPT_META_COL.left);
  const r = truncate(right, RECEIPT_META_COL.right);
  const gap = Math.max(1, RECEIPT_RULE_WIDTH - l.length - r.length);
  return l + " ".repeat(gap) + r;
}

/** แถวตาราง 3 คอลัมน์ (ESC/POS fixed-width) */
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

/** แถวสรุป label + value (ESC/POS fixed-width) */
export function formatReceiptSummaryRow(label: string, value: string): string {
  const l = truncate(label, RECEIPT_SUMMARY_COL.label);
  const v = truncate(value, RECEIPT_SUMMARY_COL.value);
  const gap = Math.max(1, RECEIPT_RULE_WIDTH - l.length - v.length);
  return l + " ".repeat(gap) + v;
}
