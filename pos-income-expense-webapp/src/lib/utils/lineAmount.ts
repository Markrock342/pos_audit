/** คำนวณยอดบรรทัด = จำนวน × ราคาต่อหน่วย (ปัด 2 ตำแหน่ง) */
export function computeLineAmount(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function sumLineAmounts(amounts: number[]): number {
  return Math.round(amounts.reduce((sum, n) => sum + n, 0) * 100) / 100;
}

export interface LineItemInput {
  title: string;
  quantity: number;
  unitPrice: number;
  categoryId: string;
  sortOrder?: number;
}

export function normalizeLineItems(
  items: LineItemInput[]
): Array<LineItemInput & { lineAmount: number; sortOrder: number }> {
  return items.map((item, index) => ({
    ...item,
    sortOrder: item.sortOrder ?? index,
    lineAmount: computeLineAmount(item.quantity, item.unitPrice),
  }));
}
