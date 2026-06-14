import type { Receipt, Transaction } from "@/types";
import { formatDateShort } from "@/lib/utils/format";
import {
  formatReceiptAmount,
  hasDistinctTransactionDate,
  isEditedTransaction,
  resolveDocumentTitle,
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
  ReceiptRevisionMeta,
  ReceiptShell,
  ReceiptSummaryRow,
  ReceiptTotalBand,
} from "@/receipt-templates/shared";

interface DefaultReceiptProps {
  transaction: Transaction;
  receipt: Receipt;
  shopName?: string;
  footer?: string;
  sellerName?: string;
  address?: string;
  phone?: string;
  taxId?: string;
  fullWidth?: boolean;
  isRevision?: boolean;
  revisedAt?: string;
  editReason?: string;
}

/** ราคาต่อหน่วยจาก lineAmount/qty (กันหารศูนย์) */
function unitHint(quantity: number, lineAmount: number): string | undefined {
  if (quantity <= 1) return undefined;
  const unit = lineAmount / quantity;
  return `${quantity} × ${formatReceiptAmount(unit)}`;
}

export function DefaultReceiptTemplate({
  transaction,
  receipt,
  shopName = SHOP_NAME,
  footer = "ขอบคุณที่ใช้บริการ",
  sellerName,
  address,
  phone,
  taxId,
  fullWidth,
  isRevision: isRevisionProp,
  revisedAt,
  editReason,
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
  const itemCount = lines.reduce((n, l) => n + (Number(l.quantity) || 0), 0);
  const isRevision = isRevisionProp ?? isEditedTransaction(transaction);
  const { title, titleEn } = resolveDocumentTitle("income", isRevision);

  return (
    <ReceiptShell fullWidth={fullWidth}>
      <ReceiptHeader
        shopName={shopName}
        subtitle={title}
        subtitleEn={titleEn}
        address={address}
        phone={phone}
        taxId={taxId}
      />

      <div className="mt-2 space-y-0.5">
        <ReceiptMetaPair left={`เลขที่ ${receiptNo}`} right={billTitle !== "—" ? billTitle : ""} />
        <ReceiptMetaPair left={`วันที่ ${date}`} right={`เวลา ${time}`} />
        <ReceiptMetaSingle text={`ผู้ขาย: ${seller}`} />
        {showTxDate && (
          <ReceiptMetaSingle text={`วันที่รายการ: ${formatDateShort(transaction.transactionDate)}`} />
        )}
        {isRevision && (
          <ReceiptRevisionMeta
            revisedAt={revisedAt ?? transaction.updatedAt}
            editReason={editReason}
          />
        )}
      </div>

      <ReceiptDivider />
      <ReceiptItemTableHeader />
      <ReceiptDivider dashed />

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
            hint={unitHint(Number(line.quantity) || 0, line.lineAmount)}
          />
        ))}
      </div>

      <ReceiptDivider />

      <div className="space-y-0.5">
        <ReceiptSummaryRow label={`รวมย่อย (${itemCount} ชิ้น)`} value={formatReceiptAmount(subtotal)} />
        {discount > 0 && (
          <ReceiptSummaryRow label="ส่วนลด" value={`-${formatReceiptAmount(discount)}`} />
        )}
      </div>

      <ReceiptTotalBand label="ยอดสุทธิ" value={formatReceiptAmount(netTotal)} />

      <div className="space-y-0.5">
        <ReceiptSummaryRow label="ชำระโดย" value={paymentLabel} bold />
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

      <ReceiptFooter text={footer} note="เอกสารออกจากระบบ POS · เก็บไว้เป็นหลักฐาน" />
    </ReceiptShell>
  );
}
