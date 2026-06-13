import type { Transaction } from "@/types";
import { formatDateShort } from "@/lib/utils/format";
import {
  formatReceiptAmount,
  hasDistinctTransactionDate,
  resolveExpenseVoucherNumber,
  resolvePaymentLabel,
  resolveReceiptLines,
  sumLineItems,
} from "@/lib/utils/receiptFormat";
import { RECEIPT_ITEM_HEADER, splitReceiptDateTime } from "@/lib/utils/receiptRule";
import { SHOP_NAME } from "@/constants";
import {
  escBold,
  escCenterLines,
  escConcat,
  escCut,
  escFeed,
  escInit,
  escItemRow,
  escMetaPair,
  escRow,
  escRule,
  escSubLine,
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
  const { date, time } = splitReceiptDateTime(transaction.createdAt);
  const billTitle = transaction.title?.trim() || "-";

  const chunks: Uint8Array[] = [escInit()];

  chunks.push(escCenterLines([shopName, "ใบบันทึกรายจ่าย / Expense"], true));
  chunks.push(escFeed(1));
  chunks.push(escRule());

  chunks.push(escMetaPair(`เลขที่: ${docNo}`, `ชื่อบิล: ${billTitle}`));
  chunks.push(escMetaPair(`วันที่: ${date}`, `เวลา: ${time}`));
  chunks.push(escTextLine(`ผู้บันทึก: ${recorder}`));
  if (hasDistinctTransactionDate(transaction)) {
    chunks.push(escTextLine(`วันที่รายการ: ${formatDateShort(transaction.transactionDate)}`));
  }

  chunks.push(escRule());
  chunks.push(escConcat([escBold(true), escTextLine(RECEIPT_ITEM_HEADER), escBold(false)]));
  chunks.push(escRule());

  if (lines.length === 0) {
    chunks.push(escTextLine("ยังไม่มีรายการ"));
  } else {
    for (const line of lines) {
      chunks.push(
        escItemRow(line.title, String(line.quantity), formatReceiptAmount(line.lineAmount))
      );
      const categoryName = categoryNames[line.categoryId];
      const sub = categoryName
        ? `หมวด: ${categoryName} · @ ${formatReceiptAmount(line.unitPrice)}`
        : `@ ${formatReceiptAmount(line.unitPrice)} / หน่วย`;
      chunks.push(escSubLine(sub));
    }
  }

  chunks.push(escRule());
  chunks.push(escRow(`Total (${paymentLabel})`, formatReceiptAmount(total), true));
  if (transaction.referenceNo?.trim()) {
    chunks.push(escRow("เลขที่อ้างอิง", transaction.referenceNo.trim()));
  }
  if (transaction.note?.trim()) {
    chunks.push(escRow("หมายเหตุ", transaction.note.trim()));
  }

  chunks.push(escRule());
  chunks.push(escCenterLines([footer]));
  chunks.push(escFeed(3));
  chunks.push(escCut());

  return escConcat(chunks);
}
