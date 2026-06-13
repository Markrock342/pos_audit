import type { Receipt, Transaction } from "@/types";
import { formatDateShort } from "@/lib/utils/format";
import {
  formatReceiptAmount,
  hasDistinctTransactionDate,
  resolvePaymentLabel,
  resolveReceiptLines,
  resolveReceiptNumber,
  resolveSellerName,
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

interface DefaultReceiptProps {
  transaction: Transaction;
  receipt: Receipt;
  shopName?: string;
  footer?: string;
  sellerName?: string;
  fullWidth?: boolean;
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
  const { date, time } = splitReceiptDateTime(transaction.createdAt);
  const showTxDate = hasDistinctTransactionDate(transaction);
  const billTitle = transaction.title?.trim() || "—";

  return (
    <ReceiptShell fullWidth={fullWidth}>
      <ReceiptHeader shopName={shopName} subtitle="ใบเสร็จรับเงิน / Receipt" />

      <div className="space-y-0.5">
        <ReceiptMetaPair left={`เลขที่: ${receiptNo}`} right={`ชื่อบิล: ${billTitle}`} />
        <ReceiptMetaPair left={`วันที่: ${date}`} right={`เวลา: ${time}`} />
        <ReceiptMetaSingle text={`ผู้ขาย: ${seller}`} />
        {showTxDate && (
          <ReceiptMetaSingle text={`วันที่รายการ: ${formatDateShort(transaction.transactionDate)}`} />
        )}
      </div>

      <ReceiptDivider />
      <ReceiptItemTableHeader />
      <ReceiptDivider />

      <div>
        {lines.length === 0 && (
          <p className="py-2 text-center text-[11px] text-black">ยังไม่มีรายการ</p>
        )}
        {lines.map((line, index) => (
          <ReceiptItemTableRow
            key={line.id ?? index}
            title={line.title}
            qty={line.quantity}
            amount={formatReceiptAmount(line.lineAmount)}
          />
        ))}
      </div>

      <ReceiptDivider />

      <div className="space-y-0.5">
        <ReceiptSummaryRow label="รวมย่อย" value={formatReceiptAmount(subtotal)} />
        <ReceiptSummaryRow label="ส่วนลด" value={formatReceiptAmount(discount)} />
      </div>

      <ReceiptDivider total />

      <div className="space-y-0.5">
        <ReceiptSummaryRow
          label={`ยอดชำระ (${paymentLabel})`}
          value={formatReceiptAmount(netTotal)}
          large
        />
        {isCash && (
          <>
            <ReceiptSummaryRow label="รับเงิน" value={formatReceiptAmount(netTotal)} />
            <ReceiptSummaryRow label="เงินทอน" value={formatReceiptAmount(0)} />
          </>
        )}
        {transaction.note?.trim() && (
          <ReceiptSummaryRow label="หมายเหตุ" value={transaction.note.trim()} />
        )}
      </div>

      <ReceiptFooter text={footer} />
    </ReceiptShell>
  );
}
