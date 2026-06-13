/** เส้นคั่นใบเสร็จ 80mm — ความกว้างเท่ากันทุกจุด (หน้าจอ + thermal) */
export const RECEIPT_RULE_WIDTH = 42;
export const RECEIPT_RULE_CHAR = "-";

export function receiptRuleLine(): string {
  return RECEIPT_RULE_CHAR.repeat(RECEIPT_RULE_WIDTH);
}
