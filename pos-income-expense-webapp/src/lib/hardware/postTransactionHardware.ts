import { openCashDrawer } from "@/lib/hardware/cashDrawer";
import { shouldOpenCashDrawer } from "@/lib/hardware/cashDrawerPolicy";
import { printTransactionDocument } from "@/lib/hardware/printTransactionDocument";
import type { Category, Transaction } from "@/types";

/** หลังบันทึกรายการ — บันทึก=เปิดลิ้นชัก (เงินสด), บันทึก+พิมพ์=พิมพ์+เปิดลิ้นชัก */
export async function runPostTransactionHardware(
  transaction: Transaction,
  options: { print: boolean; categories?: Category[] }
): Promise<void> {
  const openDrawer = shouldOpenCashDrawer(transaction);

  if (options.print) {
    const result = await printTransactionDocument(transaction, {
      categories: options.categories,
    }).catch(() => ({ success: false as const, message: "" }));
    if (openDrawer && !result.success) {
      await openCashDrawer().catch(() => {});
    }
    return;
  }

  if (openDrawer) {
    await openCashDrawer().catch(() => {});
  }
}
