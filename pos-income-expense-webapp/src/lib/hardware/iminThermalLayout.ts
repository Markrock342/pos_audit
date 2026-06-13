import type { IminPrinterInstance } from "@/lib/hardware/iminPrinter.types";
import {
  RECEIPT_ITEM_HEADER,
  formatReceiptItemRow,
  formatReceiptMetaPair,
  formatReceiptSubLine,
  receiptRuleLine,
  receiptTotalRuleLine,
} from "@/lib/utils/receiptRule";

export const THERMAL_COL_WIDTH = 576;
export const THERMAL_TEXT_SIZE = 22;

export function initThermalLayout(printer: IminPrinterInstance): void {
  printer.setPageFormat(0);
  printer.setTextWidth(THERMAL_COL_WIDTH);
  printer.setTextSize(THERMAL_TEXT_SIZE);
  printer.setTextLineSpacing(1.1);
  printer.setAlignment(0);
  printer.setTextStyle(0);
}

export function thermalBlankLine(printer: IminPrinterInstance): void {
  printer.printAndLineFeed();
}

export function thermalRule(printer: IminPrinterInstance): void {
  printer.printText(receiptRuleLine());
}

export function thermalTotalRule(printer: IminPrinterInstance): void {
  printer.printText(receiptTotalRuleLine());
}

export function thermalCenterLines(
  printer: IminPrinterInstance,
  lines: string[],
  bold = false
): void {
  printer.setAlignment(1);
  if (bold) printer.setTextStyle(1);
  for (const line of lines) {
    printer.printText(line);
  }
  if (bold) printer.setTextStyle(0);
  printer.setAlignment(0);
}

export function thermalMetaPair(printer: IminPrinterInstance, left: string, right: string): void {
  printer.printText(formatReceiptMetaPair(left, right));
}

export function thermalSummaryRow(
  printer: IminPrinterInstance,
  label: string,
  value: string,
  bold = false
): void {
  if (bold) printer.setTextStyle(1);
  printer.printColumnsText(
    [label, value],
    [18, 24],
    [0, 2],
    [THERMAL_TEXT_SIZE, THERMAL_TEXT_SIZE],
    THERMAL_COL_WIDTH
  );
  if (bold) printer.setTextStyle(0);
}

export function thermalItemTableHeader(printer: IminPrinterInstance): void {
  printer.setTextStyle(1);
  printer.printText(RECEIPT_ITEM_HEADER);
  printer.setTextStyle(0);
}

export function thermalThreeColRow(
  printer: IminPrinterInstance,
  item: string,
  qty: string,
  amount: string
): void {
  printer.printText(formatReceiptItemRow(item, qty, amount));
}

export function thermalSubLine(printer: IminPrinterInstance, text: string): void {
  printer.printText(formatReceiptSubLine(text));
}

export function thermalFinish(printer: IminPrinterInstance, openDrawer = false): void {
  thermalBlankLine(printer);
  printer.printAndFeedPaper(80);
  printer.partialCut();
  if (openDrawer) printer.openCashBox();
}
