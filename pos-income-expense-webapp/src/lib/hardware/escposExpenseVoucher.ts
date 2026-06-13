import type { Transaction } from "@/types";
import { formatDateShort } from "@/lib/utils/format";
import {
  formatReceiptAmount,
  formatReceiptDateTime,
  hasDistinctTransactionDate,
  resolveExpenseVoucherNumber,
  resolvePaymentLabel,
  resolveReceiptLines,
  sumLineItems,
} from "@/lib/utils/receiptFormat";
import { SHOP_NAME } from "@/constants";
import {
  escCenterLines,
  escConcat,
  escCut,
  escFeed,
  escInit,
  escRow,
  escRule,
  escTextLine,
} from "@/lib/hardware/escpos";

const DEFAULT_FOOTER = "เอกสารบันทึกภายใน — ไม่ใช่ใบกำกับภาษี";

export interface ExpenseVoucherPrintContext {
  transaction: Transaction;
  voucherNumber?: string;
  shopName?: string;
  footer?: string;
  recorderName?: string;
  categoryNames?: Record<string, string>;
}

export function buildEscPosExpenseVoucher(ctx: ExpenseVoucherPrintContext): Uint8Array {
  const { transaction } = ctx;
  const shopName = ctx.shopName?.trim() || SHOP_NAME;
  const footer = ctx.footer?.trim() || DEFAULT_FOOTER;
  const recorder = ctx.recorderName?.trim() || "-";
  const categoryNames = ctx.categoryNames ?? {};

  const lines = resolveReceiptLines(transaction);
  const total = transaction.amount ?? sumLineItems(lines);
  const paymentLabel = resolvePaymentLabel(transaction.paymentMethod);
  const docNo = resolveExpenseVoucherNumber(transaction, ctx.voucherNumber);
  const recordedAt = formatReceiptDateTime(transaction.createdAt);
  const billTitle = transaction.title?.trim();

  const chunks: Uint8Array[] = [escInit()];

  chunks.push(escCenterLines([shopName, "ใบบันทึกรายจ่าย"], true));
  chunks.push(escFeed(1));
  chunks.push(escRule("-"));

  chunks.push(escRow("เลขที่", docNo));
  chunks.push(escRow("วันที่บันทึก", recordedAt));
  chunks.push(escRow("ผู้บันทึก", recorder));
  if (billTitle) chunks.push(escRow("ชื่อบิล", billTitle));
  if (hasDistinctTransactionDate(transaction)) {
    chunks.push(escRow("วันที่รายการ", formatDateShort(transaction.transactionDate)));
  }

  chunks.push(escFeed(1));
  chunks.push(escRule("."));

  if (lines.length === 0) {
    chunks.push(escTextLine("ยังไม่มีรายการ"));
  } else {
    for (const line of lines) {
      chunks.push(escTextLine(line.title));
      const categoryName = categoryNames[line.categoryId];
      if (categoryName) chunks.push(escTextLine(`หมวด: ${categoryName}`));
      chunks.push(
        escRow(
          `${line.quantity} x ${formatReceiptAmount(line.unitPrice)}`,
          formatReceiptAmount(line.lineAmount)
        )
      );
      chunks.push(escFeed(1));
    }
  }

  chunks.push(escRule("."));
  chunks.push(escFeed(1));
  chunks.push(escRow("รวมจ่าย", formatReceiptAmount(total), true));
  chunks.push(escRow("ชำระโดย", paymentLabel));
  if (transaction.referenceNo?.trim()) {
    chunks.push(escRow("เลขที่อ้างอิง", transaction.referenceNo.trim()));
  }
  if (transaction.note?.trim()) {
    chunks.push(escRow("หมายเหตุ", transaction.note.trim()));
  }

  chunks.push(escFeed(1));
  chunks.push(escRule("-"));
  chunks.push(escCenterLines([footer]));
  chunks.push(escFeed(3));
  chunks.push(escCut());

  return escConcat(chunks);
}
