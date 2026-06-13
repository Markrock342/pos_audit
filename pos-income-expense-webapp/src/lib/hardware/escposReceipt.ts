import type { Receipt, Transaction } from "@/types";
import { formatDateShort } from "@/lib/utils/format";
import {
  formatReceiptAmount,
  hasDistinctTransactionDate,
  resolvePaymentLabel,
  resolveReceiptLines,
  resolveReceiptNumber,
  sumLineItems,
} from "@/lib/utils/receiptFormat";
import { RECEIPT_ITEM_HEADER, splitReceiptDateTime } from "@/lib/utils/receiptRule";
import { SHOP_NAME } from "@/constants";
import { buildDrawerKickCommand, type DrawerKickPin } from "@/lib/hardware/cashDrawer";
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
  escTotalRule,
  escTextLine,
} from "@/lib/hardware/escpos";

export interface ReceiptPrintContext {
  transaction: Transaction;
  receipt: Receipt;
  shopName?: string;
  footer?: string;
  sellerName?: string;
}

export interface BuildEscPosOptions {
  openDrawer?: boolean;
  drawerPin?: DrawerKickPin;
}

export function buildEscPosReceipt(
  ctx: ReceiptPrintContext,
  options?: BuildEscPosOptions
): Uint8Array {
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

  const chunks: Uint8Array[] = [escInit()];

  chunks.push(escCenterLines([shopName, "ใบเสร็จรับเงิน / Receipt"], true));
  chunks.push(escFeed(1));
  chunks.push(escRule());

  chunks.push(escMetaPair(`เลขที่: ${receiptNo}`, `ชื่อบิล: ${billTitle}`));
  chunks.push(escMetaPair(`วันที่: ${date}`, `เวลา: ${time}`));
  chunks.push(escTextLine(`ผู้ขาย: ${seller}`));
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
    }
  }

  chunks.push(escRule());
  chunks.push(escRow("รวมย่อย", formatReceiptAmount(subtotal)));
  chunks.push(escRow("ส่วนลด", formatReceiptAmount(0)));

  chunks.push(escTotalRule());
  chunks.push(escRow(`ยอดชำระ (${paymentLabel})`, formatReceiptAmount(netTotal), true));
  if (isCash) {
    chunks.push(escRow("รับเงิน", formatReceiptAmount(netTotal)));
    chunks.push(escRow("เงินทอน", formatReceiptAmount(0)));
  }
  if (transaction.note?.trim()) {
    chunks.push(escRow("หมายเหตุ", transaction.note.trim()));
  }

  chunks.push(escRule());
  chunks.push(escCenterLines([footer]));
  chunks.push(escFeed(3));

  if (options?.openDrawer && isCash) {
    chunks.push(buildDrawerKickCommand({ pin: options.drawerPin ?? "pin2" }));
  }

  chunks.push(escCut());

  return escConcat(chunks);
}
