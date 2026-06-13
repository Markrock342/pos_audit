import type { Transaction } from "@/types";

/**
 * ตามสเปกลูกค้า: รายรับและรายจ่ายเงินสด → ลิ้นชักเด้ง
 * (รับเงินเข้าลิ้นชัก / จ่ายเงินออกจากลิ้นชัก)
 */
export function shouldOpenCashDrawer(
  transaction: Pick<Transaction, "paymentMethod">
): boolean {
  return transaction.paymentMethod === "cash";
}
