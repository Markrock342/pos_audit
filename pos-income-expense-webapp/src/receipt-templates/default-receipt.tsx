import type { Receipt, Transaction } from "@/types";
import { formatDateShort } from "@/lib/utils/format";
import {
  formatReceiptAmount,
  formatReceiptDateTime,
  hasDistinctTransactionDate,
  resolvePaymentLabel,
  resolveReceiptLines,
  resolveReceiptNumber,
  resolveSellerName,
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
  const printedAt = formatReceiptDateTime(transaction.createdAt);
  const showTxDate = hasDistinctTransactionDate(transaction);
  const billTitle = transaction.title?.trim();

  return (
    <ReceiptShell fullWidth={fullWidth}>
      <ReceiptHeader shopName={shopName} subtitle="ใบเสร็จรับเงิน / Receipt" />

      <div className="mt-3 space-y-1">
        <ReceiptMetaRow label="เลขที่" value={receiptNo} />
        <ReceiptMetaRow label="วันที่" value={printedAt} />
        <ReceiptMetaRow label="ผู้ขาย" value={seller} />
        {billTitle && <ReceiptMetaRow label="ชื่อบิล" value={billTitle} />}
        {showTxDate && (
          <ReceiptMetaRow label="วันที่รายการ" value={formatDateShort(transaction.transactionDate)} />
        )}
      </div>

      <ReceiptDivider />

      <div className="space-y-2">
        {lines.length === 0 && (
          <p className="text-center text-[10px] text-gray-500">ยังไม่มีรายการ</p>
        )}
        {lines.map((line, index) => (
          <ReceiptLineItem
            key={line.id ?? index}
            title={line.title}
            detail={`${line.quantity} x ${formatReceiptAmount(line.unitPrice)}`}
            amount={formatReceiptAmount(line.lineAmount)}
          />
        ))}
      </div>

      <ReceiptDivider />

      <ReceiptTotalsBlock>
        <ReceiptAmountRow label="รวม" value={formatReceiptAmount(subtotal)} />
        <ReceiptAmountRow label="ส่วนลด" value={formatReceiptAmount(discount)} />
        <ReceiptAmountRow label="สุทธิ" value={formatReceiptAmount(netTotal)} bold />
        <ReceiptAmountRow label="ชำระโดย" value={paymentLabel} />
        {isCash && (
          <>
            <ReceiptAmountRow label="รับเงิน" value={formatReceiptAmount(netTotal)} />
            <ReceiptAmountRow label="เงินทอน" value={formatReceiptAmount(0)} />
          </>
        )}
        {transaction.note?.trim() && (
          <ReceiptMetaRow label="หมายเหตุ" value={transaction.note.trim()} />
        )}
      </ReceiptTotalsBlock>

      <ReceiptFooter text={footer} />
    </ReceiptShell>
  );
}
