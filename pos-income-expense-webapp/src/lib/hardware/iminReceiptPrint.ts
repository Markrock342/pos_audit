import type { Receipt, Transaction } from "@/types";
import { SHOP_NAME } from "@/constants";
import { formatDateShort } from "@/lib/utils/format";
import {
  formatReceiptAmount,
  hasDistinctTransactionDate,
  resolvePaymentLabel,
  resolveReceiptLines,
  resolveReceiptNumber,
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

export interface IminReceiptContext {
  transaction: Transaction;
  receipt: Receipt;
  shopName?: string;
  footer?: string;
  sellerName?: string;
  openDrawer?: boolean;
}

export function printReceiptOnImin(
  printer: IminPrinterInstance,
  ctx: IminReceiptContext
): void {
  const { transaction, receipt } = ctx;
  const shopName = ctx.shopName?.trim() || SHOP_NAME;
  const footer = ctx.footer?.trim() || "ขอบคุณที่ใช้บริการ";
  const seller = ctx.sellerName?.trim() || "-";

  const lines = resolveReceiptLines(transaction);
  const subtotal = sumLineItems(lines);
  const netTotal = transaction.amount ?? subtotal;
  const paymentLabel = resolvePaymentLabel(transaction.paymentMethod);
  const isCash = transaction.paymentMethod === "cash";
  const receiptNo = resolveReceiptNumber(transaction, receipt.receiptNumber);
  const { date, time } = splitReceiptDateTime(transaction.createdAt);
  const billTitle = transaction.title?.trim() || "-";

  initThermalLayout(printer);

  thermalCenterLines(printer, [shopName, "ใบเสร็จรับเงิน / Receipt"], true);
  thermalBlankLine(printer);
  thermalRule(printer);

  thermalMetaPair(printer, `เลขที่: ${receiptNo}`, `ชื่อบิล: ${billTitle}`);
  thermalMetaPair(printer, `วันที่: ${date}`, `เวลา: ${time}`);
  printer.printText(`ผู้ขาย: ${seller}`);
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
      thermalSubLine(printer, `@ ${formatReceiptAmount(line.unitPrice)} / หน่วย`);
    }
  }

  thermalRule(printer);
  thermalSummaryRow(printer, "Sub-total", formatReceiptAmount(subtotal));
  thermalSummaryRow(printer, "ส่วนลด", formatReceiptAmount(0));

  thermalRule(printer);
  thermalSummaryRow(printer, `Total (${paymentLabel})`, formatReceiptAmount(netTotal), true);
  if (isCash) {
    thermalSummaryRow(printer, "รับเงิน", formatReceiptAmount(netTotal));
    thermalSummaryRow(printer, "เงินทอน", formatReceiptAmount(0));
  }
  if (transaction.note?.trim()) {
    thermalSummaryRow(printer, "หมายเหตุ", transaction.note.trim());
  }

  thermalRule(printer);
  thermalCenterLines(printer, [footer]);
  thermalFinish(printer, ctx.openDrawer && isCash);
}
