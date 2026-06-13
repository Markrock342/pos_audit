import type { IminPrinterInstance } from "@/lib/hardware/iminPrinter.types";
import {
  RECEIPT_ITEM_COL_WIDTHS,
  RECEIPT_META_COL_WIDTHS,
  RECEIPT_SUMMARY_COL_WIDTHS,
  receiptRuleLine,
  receiptTotalRuleLine,
} from "@/lib/utils/receiptRule";

/** 80mm printable width — iMin SDK (576 dots @ 203dpi) */
export const THERMAL_COL_WIDTH = 576;
export const THERMAL_TEXT_SIZE = 22;
export const THERMAL_TITLE_SIZE = 28;

const ALIGN_LEFT = 0;
const ALIGN_CENTER = 1;
const ALIGN_RIGHT = 2;

function textSizes(count: number, size = THERMAL_TEXT_SIZE): number[] {
  return Array.from({ length: count }, () => size);
}

export function initThermalLayout(printer: IminPrinterInstance): void {
  printer.setPageFormat(0);
  printer.setTextWidth(THERMAL_COL_WIDTH);
  printer.setTextSize(THERMAL_TEXT_SIZE);
  printer.setTextLineSpacing(1.0);
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
  bold = false,
  titleSize = false
): void {
  printer.setAlignment(1);
  if (bold) printer.setTextStyle(1);
  if (titleSize) printer.setTextSize(THERMAL_TITLE_SIZE);
  for (const line of lines) {
    printer.printText(line);
  }
  if (titleSize) printer.setTextSize(THERMAL_TEXT_SIZE);
  if (bold) printer.setTextStyle(0);
  printer.setAlignment(0);
}

/** meta 2 คอลัมน์ — ใช้ printColumnsText แทน space padding */
export function thermalMetaPair(printer: IminPrinterInstance, left: string, right: string): void {
  printer.printColumnsText(
    [left, right],
    [...RECEIPT_META_COL_WIDTHS],
    [ALIGN_LEFT, ALIGN_RIGHT],
    textSizes(2),
    THERMAL_COL_WIDTH
  );
}

/** สรุปยอด 2 คอลัมน์ */
export function thermalSummaryRow(
  printer: IminPrinterInstance,
  label: string,
  value: string,
  bold = false
): void {
  if (bold) printer.setTextStyle(1);
  printer.printColumnsText(
    [label, value],
    [...RECEIPT_SUMMARY_COL_WIDTHS],
    [ALIGN_LEFT, ALIGN_RIGHT],
    textSizes(2),
    THERMAL_COL_WIDTH
  );
  if (bold) printer.setTextStyle(0);
}

/** แถวยอดสุทธิ — ตัวหนา ขนาดใหญ่ ดึงสายตา */
export function thermalTotalRow(
  printer: IminPrinterInstance,
  label: string,
  value: string
): void {
  printer.setTextStyle(1);
  printer.printColumnsText(
    [label, value],
    [...RECEIPT_SUMMARY_COL_WIDTHS],
    [ALIGN_LEFT, ALIGN_RIGHT],
    [THERMAL_TITLE_SIZE, THERMAL_TITLE_SIZE],
    THERMAL_COL_WIDTH
  );
  printer.setTextStyle(0);
}

/** หัวตาราง 3 คอลัมน์ */
export function thermalItemTableHeader(printer: IminPrinterInstance): void {
  thermalThreeColRow(printer, "รายการ", "จำนวน", "รวม", true);
}

/** แถวรายการ 3 คอลัมน์ — จัดคอลัมน์ด้วย SDK ไม่ใช้ space */
export function thermalThreeColRow(
  printer: IminPrinterInstance,
  item: string,
  qty: string,
  amount: string,
  bold = false
): void {
  if (bold) printer.setTextStyle(1);
  printer.printColumnsText(
    [item, qty, amount],
    [...RECEIPT_ITEM_COL_WIDTHS],
    [ALIGN_LEFT, ALIGN_CENTER, ALIGN_RIGHT],
    textSizes(3),
    THERMAL_COL_WIDTH
  );
  if (bold) printer.setTextStyle(0);
}

export function thermalSubLine(printer: IminPrinterInstance, text: string): void {
  printer.printText(`  ${text}`);
}

export function thermalFinish(printer: IminPrinterInstance, openDrawer = false): void {
  thermalBlankLine(printer);
  printer.printAndFeedPaper(80);
  printer.partialCut();
  if (openDrawer) printer.openCashBox();
}
