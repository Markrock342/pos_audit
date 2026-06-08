import type { Transaction } from "@/types";
import { formatDateShort } from "@/lib/utils/format";
import {
  formatReceiptAmount,
  formatReceiptDateTime,
  hasDistinctTransactionDate,
  resolveExpenseVoucherNumber,
  resolvePaymentLabel,
  resolveReceiptLines,
  resolveRecorderName,
  sumLineItems,
} from "@/lib/utils/receiptFormat";
import { SHOP_NAME } from "@/constants";

const DEFAULT_FOOTER = "เอกสารบันทึกภายใน — ไม่ใช่ใบกำกับภาษี";

interface DefaultExpenseVoucherProps {
  transaction: Transaction;
  voucherNumber?: string;
  shopName?: string;
  footer?: string;
  recorderName?: string;
  categoryNames?: Record<string, string>;
  fullWidth?: boolean;
}

function VoucherRule({ char = "-" }: { char?: string }) {
  return (
    <div
      className="my-2 overflow-hidden whitespace-nowrap text-[10px] leading-none text-gray-500"
      aria-hidden
    >
      {char.repeat(42)}
    </div>
  );
}

function VoucherRow({
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
      <span className="min-w-0 text-right tabular-nums break-words">{value}</span>
    </div>
  );
}

export function DefaultExpenseVoucherTemplate({
  transaction,
  voucherNumber,
  shopName = SHOP_NAME,
  footer = DEFAULT_FOOTER,
  recorderName,
  categoryNames = {},
  fullWidth,
}: DefaultExpenseVoucherProps) {
  const lines = resolveReceiptLines(transaction);
  const total = transaction.amount ?? sumLineItems(lines);
  const paymentLabel = resolvePaymentLabel(transaction.paymentMethod);
  const docNo = resolveExpenseVoucherNumber(transaction, voucherNumber);
  const recorder = recorderName ?? resolveRecorderName(transaction.createdBy);
  const recordedAt = formatReceiptDateTime(transaction.createdAt);
  const showTxDate = hasDistinctTransactionDate(transaction);

  return (
    <div
      className={`mx-auto bg-white p-4 font-mono text-[11px] leading-snug text-black ${
        fullWidth ? "w-full" : "w-[300px]"
      }`}
    >
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-wide">{shopName}</p>
        <p className="mt-1 text-[10px] text-gray-700">ใบบันทึกรายจ่าย</p>
      </div>

      <VoucherRule char="-" />

      <div className="space-y-0.5">
        <VoucherRow label="เลขที่:" value={docNo} />
        <VoucherRow label="วันที่บันทึก:" value={recordedAt} />
        <VoucherRow label="ผู้บันทึก:" value={recorder} />
        <VoucherRow label="หัวเรื่อง:" value={transaction.title} />
        {showTxDate && (
          <VoucherRow
            label="วันที่รายการ:"
            value={formatDateShort(transaction.transactionDate)}
          />
        )}
      </div>

      <VoucherRule char="." />

      <div className="space-y-2.5">
        {lines.map((line, index) => {
          const categoryName = categoryNames[line.categoryId];
          return (
            <div key={line.id ?? index}>
              <p className="text-[11px] leading-tight">{line.title}</p>
              {categoryName && (
                <p className="text-[10px] text-gray-600">หมวด: {categoryName}</p>
              )}
              <div className="flex justify-between gap-2 text-[11px] tabular-nums">
                <span>
                  {line.quantity} x {formatReceiptAmount(line.unitPrice)}
                </span>
                <span>{formatReceiptAmount(line.lineAmount)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <VoucherRule char="." />

      <div className="space-y-0.5">
        <VoucherRow label="รวมจ่าย" value={formatReceiptAmount(total)} bold />
        <VoucherRow label="ชำระโดย" value={paymentLabel} />
        {transaction.referenceNo?.trim() && (
          <VoucherRow label="เลขที่อ้างอิง" value={transaction.referenceNo.trim()} />
        )}
        {transaction.note?.trim() && (
          <VoucherRow label="หมายเหตุ" value={transaction.note.trim()} />
        )}
      </div>

      <VoucherRule char="." />

      <p className="pt-1 text-center text-[10px] text-gray-700">{footer}</p>
    </div>
  );
}
