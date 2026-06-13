import type { Receipt, Transaction } from "@/types";
import { SHOP_NAME } from "@/constants";
import { formatDateShort } from "@/lib/utils/format";
import {
  formatReceiptAmount,
  formatReceiptDateTime,
  hasDistinctTransactionDate,
  resolvePaymentLabel,
  resolveReceiptLines,
  resolveReceiptNumber,
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
  const printedAt = formatReceiptDateTime(transaction.createdAt);
  const billTitle = transaction.title?.trim();

  initThermalLayout(printer);

  thermalCenterLines(printer, [shopName, "ใบเสร็จรับเงิน / Receipt"], true);
  thermalBlankLine(printer);
  thermalRule(printer);

  thermalRow(printer, "เลขที่", receiptNo);
  thermalRow(printer, "วันที่", printedAt);
  thermalRow(printer, "ผู้ขาย", seller);
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

  thermalRow(printer, "รวม", formatReceiptAmount(subtotal));
  thermalRow(printer, "ส่วนลด", formatReceiptAmount(0));
  thermalRow(printer, "สุทธิ", formatReceiptAmount(netTotal), true);
  thermalRow(printer, "ชำระโดย", paymentLabel);
  if (isCash) {
    thermalRow(printer, "รับเงิน", formatReceiptAmount(netTotal));
    thermalRow(printer, "เงินทอน", formatReceiptAmount(0));
  }
  if (transaction.note?.trim()) {
    thermalRow(printer, "หมายเหตุ", transaction.note.trim());
  }

  thermalBlankLine(printer);
  thermalRule(printer);
  thermalCenterLines(printer, [footer]);
  thermalFinish(printer, ctx.openDrawer && isCash);
}
