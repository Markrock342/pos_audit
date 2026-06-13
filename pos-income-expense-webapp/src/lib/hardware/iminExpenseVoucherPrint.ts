import type { Transaction } from "@/types";
import { SHOP_NAME } from "@/constants";
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
import type { IminPrinterInstance } from "@/lib/hardware/iminPrinter.types";
import {
  initThermalLayout,
  thermalBlankLine,
  thermalCenterLines,
  thermalFinish,
  thermalItemLine,
  thermalRow,
  thermalRule,
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
  const recordedAt = formatReceiptDateTime(transaction.createdAt);
  const billTitle = transaction.title?.trim();

  initThermalLayout(printer);

  thermalCenterLines(printer, [shopName, "ใบบันทึกรายจ่าย"], true);
  thermalBlankLine(printer);
  thermalRule(printer);

  thermalRow(printer, "เลขที่", docNo);
  thermalRow(printer, "วันที่บันทึก", recordedAt);
  thermalRow(printer, "ผู้บันทึก", recorder);
  if (billTitle) thermalRow(printer, "ชื่อบิล", billTitle);
  if (hasDistinctTransactionDate(transaction)) {
    thermalRow(printer, "วันที่รายการ", formatDateShort(transaction.transactionDate));
  }

  thermalBlankLine(printer);
  thermalRule(printer);

  if (lines.length === 0) {
    printer.printText("ยังไม่มีรายการ");
  } else {
    for (const line of lines) {
      printer.printText(line.title);
      const categoryName = categoryNames[line.categoryId];
      if (categoryName) {
        printer.printText(`หมวด: ${categoryName}`);
      }
      thermalItemLine(
        printer,
        `${line.quantity} x ${formatReceiptAmount(line.unitPrice)}`,
        formatReceiptAmount(line.lineAmount)
      );
      thermalBlankLine(printer);
    }
  }

  thermalRule(printer);
  thermalBlankLine(printer);

  thermalRow(printer, "รวมจ่าย", formatReceiptAmount(total), true);
  thermalRow(printer, "ชำระโดย", paymentLabel);
  if (transaction.referenceNo?.trim()) {
    thermalRow(printer, "เลขที่อ้างอิง", transaction.referenceNo.trim());
  }
  if (transaction.note?.trim()) {
    thermalRow(printer, "หมายเหตุ", transaction.note.trim());
  }

  thermalBlankLine(printer);
  thermalRule(printer);
  thermalCenterLines(printer, [footer]);
  thermalFinish(printer, false);
}
