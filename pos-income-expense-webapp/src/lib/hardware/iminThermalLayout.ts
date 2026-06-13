import type { IminPrinterInstance } from "@/lib/hardware/iminPrinter.types";
import { receiptRuleLine } from "@/lib/utils/receiptRule";

export const THERMAL_COL_WIDTH = 576;
export const THERMAL_TEXT_SIZE = 24;

export function initThermalLayout(printer: IminPrinterInstance): void {
  printer.setPageFormat(0);
  printer.setTextWidth(THERMAL_COL_WIDTH);
  printer.setTextSize(THERMAL_TEXT_SIZE);
  printer.setTextLineSpacing(1.15);
  printer.setAlignment(0);
  printer.setTextStyle(0);
}

export function thermalBlankLine(printer: IminPrinterInstance): void {
  printer.printAndLineFeed();
}

/** เส้นคั่นเต็มความกว้าง — ตรงกับ preview บนหน้าจอ */
export function thermalRule(printer: IminPrinterInstance): void {
  printer.printText(receiptRuleLine());
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

/** Label left, value right — amounts should already be formatted */
export function thermalRow(
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

export function thermalItemLine(
  printer: IminPrinterInstance,
  detail: string,
  amount: string
): void {
  printer.printColumnsText(
    [detail, amount],
    [24, 18],
    [0, 2],
    [THERMAL_TEXT_SIZE, THERMAL_TEXT_SIZE],
    THERMAL_COL_WIDTH
  );
}

export function thermalFinish(printer: IminPrinterInstance, openDrawer = false): void {
  thermalBlankLine(printer);
  printer.printAndFeedPaper(80);
  printer.partialCut();
  if (openDrawer) printer.openCashBox();
}
