import type { Receipt, Transaction } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { SHOP_NAME } from "@/constants";

interface DefaultReceiptProps {
  transaction: Transaction;
  receipt: Receipt;
  shopName?: string;
  footer?: string;
}

export function DefaultReceiptTemplate({
  transaction,
  receipt,
  shopName = SHOP_NAME,
  footer = "ขอบคุณที่อุดหนุน",
}: DefaultReceiptProps) {
  const lines =
    transaction.lineItems && transaction.lineItems.length > 0
      ? transaction.lineItems
      : [
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

  return (
    <div className="mx-auto w-[280px] bg-white p-4 font-mono text-xs text-black">
      <div className="text-center">
        <p className="text-sm font-bold">{shopName}</p>
        <p className="mt-1 text-[10px] text-gray-600">ใบเสร็จรับเงิน</p>
      </div>
      <div className="my-3 border-t border-dashed border-gray-400" />
      <p>เลขที่: {receipt.receiptNumber}</p>
      <p>วันที่: {formatDate(transaction.transactionDate || transaction.createdAt)}</p>
      <p className="font-semibold">{transaction.title}</p>
      <div className="my-2 border-t border-dashed border-gray-300" />
      {lines.map((line, index) => (
        <div key={line.id ?? index} className="mb-2">
          <p>{line.title}</p>
          <p className="text-[10px] text-gray-600">
            {line.quantity} × {formatCurrency(line.unitPrice)} = {formatCurrency(line.lineAmount)}
          </p>
        </div>
      ))}
      <p className="mt-2 text-base font-bold">
        ยอดรวม: {formatCurrency(transaction.amount)}
      </p>
      <div className="my-3 border-t border-dashed border-gray-400" />
      <p className="text-center text-[10px] text-gray-500">{footer}</p>
    </div>
  );
}
