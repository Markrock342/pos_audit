import type { Transaction } from "@/types";
import { SHOP_NAME } from "@/constants";
import { formatDateShort } from "@/lib/utils/format";
import {
  formatReceiptAmount,
  hasDistinctTransactionDate,
  resolveExpenseVoucherNumber,
  resolvePaymentLabel,
  resolveReceiptLines,
  sumLineItems,
} from "@/lib/utils/receiptFormat";
import { splitReceiptDateTime } from "@/lib/utils/receiptRule";
import type { IminPrinterInstance } from "@/lib/hardware/iminPrinter.types";
import {
  initThermalLayout,
  thermalBlankLine,
  thermalCenterLines,
  thermalFinish,
  thermalItemTableHeader,
  thermalMetaPair,
  thermalRule,
  thermalSubLine,
  thermalSummaryRow,
  thermalThreeColRow,
} from "@/lib/hardware/iminThermalLayout";

const DEFAULT_FOOTER = "เอกสารบันทึกภายใน — ไม่ใช่ใบกำกับภาษี";

export interface IminExpenseVoucherContext {
  transaction: Transaction;
  voucherNumber?: string;
  shopName?: string;
  footer?: string;
  recorderName?: string;
  categoryNames?: Record<string, string>;
}

export function printExpenseVoucherOnImin(
  printer: IminPrinterInstance,
  ctx: IminExpenseVoucherContext
): void {
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

  initThermalLayout(printer);

  thermalCenterLines(printer, [shopName, "ใบบันทึกรายจ่าย / Expense"], true);
  thermalBlankLine(printer);
  thermalRule(printer);

  thermalMetaPair(printer, `เลขที่: ${docNo}`, `ชื่อบิล: ${billTitle}`);
  thermalMetaPair(printer, `วันที่: ${date}`, `เวลา: ${time}`);
  printer.printText(`ผู้บันทึก: ${recorder}`);
  if (hasDistinctTransactionDate(transaction)) {
    printer.printText(`วันที่รายการ: ${formatDateShort(transaction.transactionDate)}`);
  }

  thermalRule(printer);
  thermalItemTableHeader(printer);
  thermalRule(printer);

  if (lines.length === 0) {
    printer.printText("ยังไม่มีรายการ");
  } else {
    for (const line of lines) {
      thermalThreeColRow(
        printer,
        line.title,
        String(line.quantity),
        formatReceiptAmount(line.lineAmount)
      );
      const categoryName = categoryNames[line.categoryId];
      const sub = categoryName
        ? `หมวด: ${categoryName} · @ ${formatReceiptAmount(line.unitPrice)}`
        : `@ ${formatReceiptAmount(line.unitPrice)} / หน่วย`;
      thermalSubLine(printer, sub);
    }
  }

  thermalRule(printer);
  thermalSummaryRow(printer, `Total (${paymentLabel})`, formatReceiptAmount(total), true);
  if (transaction.referenceNo?.trim()) {
    thermalSummaryRow(printer, "เลขที่อ้างอิง", transaction.referenceNo.trim());
  }
  if (transaction.note?.trim()) {
    thermalSummaryRow(printer, "หมายเหตุ", transaction.note.trim());
  }

  thermalRule(printer);
  thermalCenterLines(printer, [footer]);
  thermalFinish(printer, false);
}
