import type { Transaction } from "@/types";
import { formatDateShort } from "@/lib/utils/format";
import {
  formatReceiptAmount,
  hasDistinctTransactionDate,
  resolveExpenseVoucherNumber,
  resolvePaymentLabel,
  resolveReceiptLines,
  resolveRecorderName,
  sumLineItems,
} from "@/lib/utils/receiptFormat";
import { splitReceiptDateTime } from "@/lib/utils/receiptRule";
import { SHOP_NAME } from "@/constants";
import {
  ReceiptDivider,
  ReceiptFooter,
  ReceiptHeader,
  ReceiptItemTableHeader,
  ReceiptItemTableRow,
  ReceiptMetaPair,
  ReceiptMetaSingle,
  ReceiptShell,
  ReceiptSummaryRow,
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
  const { date, time } = splitReceiptDateTime(transaction.createdAt);
  const showTxDate = hasDistinctTransactionDate(transaction);
  const billTitle = transaction.title?.trim() || "—";

  return (
    <ReceiptShell fullWidth={fullWidth}>
      <ReceiptHeader shopName={shopName} subtitle="ใบบันทึกรายจ่าย / Expense" />

      <div className="space-y-1">
        <ReceiptMetaPair left={`เลขที่: ${docNo}`} right={`ชื่อบิล: ${billTitle}`} />
        <ReceiptMetaPair left={`วันที่: ${date}`} right={`เวลา: ${time}`} />
        <ReceiptMetaSingle text={`ผู้บันทึก: ${recorder}`} />
        {showTxDate && (
          <ReceiptMetaSingle text={`วันที่รายการ: ${formatDateShort(transaction.transactionDate)}`} />
        )}
      </div>

      <ReceiptDivider />
      <ReceiptItemTableHeader />
      <ReceiptDivider />

      <div className="space-y-0.5">
        {lines.length === 0 && (
          <p className="py-1 text-center text-[10px] text-gray-500">ยังไม่มีรายการ</p>
        )}
        {lines.map((line, index) => {
          const categoryName = categoryNames[line.categoryId];
          return (
            <ReceiptItemTableRow
              key={line.id ?? index}
              title={line.title}
              qty={line.quantity}
              amount={formatReceiptAmount(line.lineAmount)}
              subline={
                categoryName
                  ? `หมวด: ${categoryName} · @ ${formatReceiptAmount(line.unitPrice)}`
                  : `@ ${formatReceiptAmount(line.unitPrice)} / หน่วย`
              }
            />
          );
        })}
      </div>

      <ReceiptDivider />

      <div className="space-y-0.5">
        <ReceiptSummaryRow
          label={`Total (${paymentLabel})`}
          value={formatReceiptAmount(total)}
          bold
        />
        {transaction.referenceNo?.trim() && (
          <ReceiptSummaryRow label="เลขที่อ้างอิง" value={transaction.referenceNo.trim()} />
        )}
        {transaction.note?.trim() && (
          <ReceiptSummaryRow label="หมายเหตุ" value={transaction.note.trim()} />
        )}
      </div>

      <ReceiptFooter text={footer} />
    </ReceiptShell>
  );
}
