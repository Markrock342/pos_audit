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
import {
  ReceiptAmountRow,
  ReceiptDivider,
  ReceiptFooter,
  ReceiptHeader,
  ReceiptLineItem,
  ReceiptMetaRow,
  ReceiptShell,
  ReceiptTotalsBlock,
} from "@/receipt-templates/shared";

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
    <ReceiptShell fullWidth={fullWidth}>
      <ReceiptHeader shopName={shopName} subtitle="ใบบันทึกรายจ่าย" />

      <div className="mt-3 space-y-1">
        <ReceiptMetaRow label="เลขที่" value={docNo} />
        <ReceiptMetaRow label="วันที่บันทึก" value={recordedAt} />
        <ReceiptMetaRow label="ผู้บันทึก" value={recorder} />
        {transaction.title?.trim() && (
          <ReceiptMetaRow label="ชื่อบิล" value={transaction.title.trim()} />
        )}
        {showTxDate && (
          <ReceiptMetaRow label="วันที่รายการ" value={formatDateShort(transaction.transactionDate)} />
        )}
      </div>

      <ReceiptDivider />

      <div className="space-y-2">
        {lines.length === 0 && (
          <p className="text-center text-[10px] text-gray-500">ยังไม่มีรายการ</p>
        )}
        {lines.map((line, index) => {
          const categoryName = categoryNames[line.categoryId];
          return (
            <ReceiptLineItem
              key={line.id ?? index}
              title={line.title}
              meta={categoryName ? `หมวด: ${categoryName}` : undefined}
              detail={`${line.quantity} x ${formatReceiptAmount(line.unitPrice)}`}
              amount={formatReceiptAmount(line.lineAmount)}
            />
          );
        })}
      </div>

      <ReceiptDivider />

      <ReceiptTotalsBlock>
        <ReceiptAmountRow label="รวมจ่าย" value={formatReceiptAmount(total)} bold />
        <ReceiptAmountRow label="ชำระโดย" value={paymentLabel} />
        {transaction.referenceNo?.trim() && (
          <ReceiptMetaRow label="เลขที่อ้างอิง" value={transaction.referenceNo.trim()} />
        )}
        {transaction.note?.trim() && (
          <ReceiptMetaRow label="หมายเหตุ" value={transaction.note.trim()} />
        )}
      </ReceiptTotalsBlock>

      <ReceiptFooter text={footer} />
    </ReceiptShell>
  );
}
