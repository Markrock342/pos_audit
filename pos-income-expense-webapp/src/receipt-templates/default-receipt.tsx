import type { Receipt, Transaction } from "@/types";
import {
  formatReceiptAmount,
  formatReceiptDateTime,
  resolvePaymentLabel,
  resolveReceiptLines,
  resolveReceiptNumber,
  resolveSellerName,
  sumLineItems,
} from "@/lib/utils/receiptFormat";
import { SHOP_NAME } from "@/constants";

interface DefaultReceiptProps {
  transaction: Transaction;
  receipt: Receipt;
  shopName?: string;
  footer?: string;
  sellerName?: string;
  fullWidth?: boolean;
}

function ReceiptRule({ char = "-" }: { char?: string }) {
  return (
    <div
      className="my-2 overflow-hidden whitespace-nowrap text-[10px] leading-none text-gray-500"
      aria-hidden
    >
      {char.repeat(42)}
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-2 text-[11px] ${bold ? "font-bold" : ""}`}>
      <span className="shrink-0">{label}</span>
      <span className="text-right tabular-nums">{value}</span>
    </div>
  );
}

export function DefaultReceiptTemplate({
  transaction,
  receipt,
  shopName = SHOP_NAME,
  footer = "ขอบคุณที่ใช้บริการ",
  sellerName,
  fullWidth,
}: DefaultReceiptProps) {
  const lines = resolveReceiptLines(transaction);
  const subtotal = sumLineItems(lines);
  const discount = 0;
  const netTotal = transaction.amount ?? subtotal;
  const paymentLabel = resolvePaymentLabel(transaction.paymentMethod);
  const isCash = transaction.paymentMethod === "cash";
  const receiptNo = resolveReceiptNumber(transaction, receipt.receiptNumber);
  const seller = sellerName ?? resolveSellerName(transaction.createdBy);
  const printedAt = formatReceiptDateTime(transaction.createdAt);

  return (
    <div
      className={`mx-auto bg-white p-4 font-mono text-[11px] leading-snug text-black ${
        fullWidth ? "w-full" : "w-[300px]"
      }`}
    >
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-wide">{shopName}</p>
        <p className="mt-1 text-[10px] text-gray-700">ใบเสร็จรับเงิน / Receipt</p>
      </div>

      <ReceiptRule char="-" />

      <div className="space-y-0.5 text-[11px]">
        <ReceiptRow label="เลขที่:" value={receiptNo} />
        <ReceiptRow label="วันที่:" value={printedAt} />
        <ReceiptRow label="ผู้ขาย:" value={seller} />
      </div>

      <ReceiptRule char="." />

      <div className="space-y-2">
        {lines.map((line, index) => (
          <div key={line.id ?? index}>
            <p className="text-[11px] leading-tight">{line.title}</p>
            <div className="flex justify-between gap-2 text-[11px] tabular-nums">
              <span>
                {line.quantity} x {formatReceiptAmount(line.unitPrice)}
              </span>
              <span>{formatReceiptAmount(line.lineAmount)}</span>
            </div>
          </div>
        ))}
      </div>

      <ReceiptRule char="." />

      <div className="space-y-0.5">
        <ReceiptRow label="รวม" value={formatReceiptAmount(subtotal)} />
        <ReceiptRow label="ส่วนลด" value={formatReceiptAmount(discount)} />
        <ReceiptRow label="สุทธิ" value={formatReceiptAmount(netTotal)} bold />
        <ReceiptRow label="ชำระโดย" value={paymentLabel} />
        {isCash && (
          <>
            <ReceiptRow label="รับเงิน" value={formatReceiptAmount(netTotal)} />
            <ReceiptRow label="เงินทอน" value={formatReceiptAmount(0)} />
          </>
        )}
      </div>

      <ReceiptRule char="." />

      <p className="pt-1 text-center text-[10px] text-gray-700">{footer}</p>
    </div>
  );
}
