import type { Receipt, Transaction } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { SHOP_NAME } from "@/constants";

interface DefaultReceiptProps {
  transaction: Transaction;
  receipt: Receipt;
}

/**
 * Receipt template for preview and future PDF/thermal print rendering.
 * Thermal printer output will use ESC/POS formatting separately.
 */
export function DefaultReceiptTemplate({
  transaction,
  receipt,
}: DefaultReceiptProps) {
  return (
    <div className="mx-auto w-[280px] bg-white p-4 font-mono text-xs text-black">
      <div className="text-center">
        <p className="text-sm font-bold">{SHOP_NAME}</p>
        <p className="mt-1 text-[10px] text-gray-600">ใบเสร็จรับเงิน</p>
      </div>
      <div className="my-3 border-t border-dashed border-gray-400" />
      <p>เลขที่: {receipt.receiptNumber}</p>
      <p>วันที่: {formatDate(transaction.createdAt)}</p>
      <p>รายการ: {transaction.title}</p>
      <p className="mt-2 text-base font-bold">
        ยอดรวม: {formatCurrency(transaction.amount)}
      </p>
      <div className="my-3 border-t border-dashed border-gray-400" />
      <p className="text-center text-[10px] text-gray-500">ขอบคุณที่อุดหนุน</p>
    </div>
  );
}
