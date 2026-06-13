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

const LINE_WIDTH = 42;
const COL_WIDTH = 576;
const TEXT_SIZE = 26;

export interface IminReceiptContext {
  transaction: Transaction;
  receipt: Receipt;
  shopName?: string;
  footer?: string;
  sellerName?: string;
  openDrawer?: boolean;
}

function rule(printer: IminPrinterInstance, char = "-"): void {
  printer.printText(char.repeat(LINE_WIDTH));
}

function row(printer: IminPrinterInstance, left: string, right: string, bold = false): void {
  if (bold) printer.setTextStyle(1);
  printer.printColumnsText(
    [left, right],
    [22, 20],
    [0, 2],
    [TEXT_SIZE, TEXT_SIZE],
    COL_WIDTH
  );
  if (bold) printer.setTextStyle(0);
}

function centerLines(printer: IminPrinterInstance, lines: string[], bold = false): void {
  printer.setAlignment(1);
  if (bold) printer.setTextStyle(1);
  for (const line of lines) {
    printer.printText(line);
  }
  if (bold) printer.setTextStyle(0);
  printer.setAlignment(0);
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

  printer.setPageFormat(0);
  printer.setTextWidth(COL_WIDTH);
  printer.setTextSize(TEXT_SIZE);
  printer.setAlignment(0);

  centerLines(printer, [shopName, "ใบเสร็จรับเงิน / Receipt"], true);
  rule(printer, "-");

  row(printer, "เลขที่:", receiptNo);
  row(printer, "วันที่:", printedAt);
  row(printer, "ผู้ขาย:", seller);
  if (billTitle) row(printer, "ชื่อบิล:", billTitle);
  if (hasDistinctTransactionDate(transaction)) {
    row(printer, "วันที่รายการ:", formatDateShort(transaction.transactionDate));
  }

  rule(printer, ".");

  if (lines.length === 0) {
    printer.printText("ยังไม่มีรายการ");
  } else {
    for (const line of lines) {
      printer.printText(line.title);
      row(
        printer,
        `${line.quantity} x ${formatReceiptAmount(line.unitPrice)}`,
        formatReceiptAmount(line.lineAmount)
      );
    }
  }

  rule(printer, ".");
  row(printer, "รวม", formatReceiptAmount(subtotal));
  row(printer, "ส่วนลด", formatReceiptAmount(0));
  row(printer, "สุทธิ", formatReceiptAmount(netTotal), true);
  row(printer, "ชำระโดย", paymentLabel);
  if (isCash) {
    row(printer, "รับเงิน", formatReceiptAmount(netTotal));
    row(printer, "เงินทอน", formatReceiptAmount(0));
  }
  if (transaction.note?.trim()) {
    row(printer, "หมายเหตุ", transaction.note.trim());
  }

  rule(printer, ".");
  centerLines(printer, [footer]);
  printer.printAndFeedPaper(80);
  printer.partialCut();

  if (ctx.openDrawer && isCash) {
    printer.openCashBox();
  }
}
