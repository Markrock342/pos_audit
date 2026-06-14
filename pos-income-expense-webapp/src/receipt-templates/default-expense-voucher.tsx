import type { Transaction } from "@/types";
import { formatDateShort } from "@/lib/utils/format";
import {
  formatReceiptAmount,
  hasDistinctTransactionDate,
  isEditedTransaction,
  resolveDocumentTitle,
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
  ReceiptRevisionMeta,
  ReceiptShell,
  ReceiptSummaryRow,
  ReceiptTotalBand,
} from "@/receipt-templates/shared";

const DEFAULT_FOOTER = "เอกสารบันทึกภายใน — ไม่ใช่ใบกำกับภาษี";

interface DefaultExpenseVoucherProps {
  transaction: Transaction;
  voucherNumber?: string;
  shopName?: string;
  footer?: string;
  recorderName?: string;
  categoryNames?: Record<string, string>;
  address?: string;
  phone?: string;
  taxId?: string;
  fullWidth?: boolean;
  isRevision?: boolean;
  revisedAt?: string;
  editReason?: string;
}

export function DefaultExpenseVoucherTemplate({
  transaction,
  voucherNumber,
  shopName = SHOP_NAME,
  footer = DEFAULT_FOOTER,
  recorderName,
  categoryNames = {},
  address,
  phone,
  taxId,
  fullWidth,
  isRevision: isRevisionProp,
  revisedAt,
  editReason,
}: DefaultExpenseVoucherProps) {
  const lines = resolveReceiptLines(transaction);
  const total = transaction.amount ?? sumLineItems(lines);
  const paymentLabel = resolvePaymentLabel(transaction.paymentMethod);
  const docNo = resolveExpenseVoucherNumber(transaction, voucherNumber);
  const recorder = recorderName ?? resolveRecorderName(transaction.createdBy);
  const { date, time } = splitReceiptDateTime(transaction.createdAt);
  const showTxDate = hasDistinctTransactionDate(transaction);
  const billTitle = transaction.title?.trim() || "—";
  const isRevision = isRevisionProp ?? isEditedTransaction(transaction);
  const { title, titleEn } = resolveDocumentTitle("expense", isRevision);

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

      <div className="space-y-0.5">
        <ReceiptMetaPair left={`เลขที่: ${docNo}`} right={`ชื่อบิล: ${billTitle}`} />
        <ReceiptMetaPair left={`วันที่: ${date}`} right={`เวลา: ${time}`} />
        <ReceiptMetaSingle text={`ผู้บันทึก: ${recorder}`} />
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
      <ReceiptDivider />

      <div>
        {lines.length === 0 && (
          <p className="py-2 text-center text-[11px] text-black">ยังไม่มีรายการ</p>
        )}
        {lines.map((line, index) => {
          const categoryName = categoryNames[line.categoryId];
          return (
            <ReceiptItemTableRow
              key={line.id ?? index}
              title={line.title}
              qty={line.quantity}
              amount={formatReceiptAmount(line.lineAmount)}
              hint={categoryName ? `หมวด: ${categoryName}` : undefined}
            />
          );
        })}
      </div>

      <ReceiptDivider />

      <ReceiptTotalBand label="ยอดจ่ายสุทธิ" value={formatReceiptAmount(total)} />

      <div className="space-y-0.5">
        <ReceiptSummaryRow label="ชำระโดย" value={paymentLabel} bold />
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
