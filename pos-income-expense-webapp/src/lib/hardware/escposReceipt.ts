import type { Receipt, Transaction } from "@/types";
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
import { SHOP_NAME } from "@/constants";
import { buildDrawerKickCommand, type DrawerKickPin } from "@/lib/hardware/cashDrawer";
import {
  escCenterLines,
  escConcat,
  escCut,
  escFeed,
  escInit,
  escRow,
  escRule,
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
  const printedAt = formatReceiptDateTime(transaction.createdAt);
  const billTitle = transaction.title?.trim();

  const chunks: Uint8Array[] = [escInit()];

  chunks.push(
    escCenterLines([shopName, "ใบเสร็จรับเงิน / Receipt"], true)
  );
  chunks.push(escRule("-"));

  chunks.push(escRow("เลขที่:", receiptNo));
  chunks.push(escRow("วันที่:", printedAt));
  chunks.push(escRow("ผู้ขาย:", seller));
  if (billTitle) chunks.push(escRow("ชื่อบิล:", billTitle));
  if (hasDistinctTransactionDate(transaction)) {
    chunks.push(escRow("วันที่รายการ:", formatDateShort(transaction.transactionDate)));
  }

  chunks.push(escRule("."));

  if (lines.length === 0) {
    chunks.push(escTextLine("ยังไม่มีรายการ"));
  } else {
    for (const line of lines) {
      chunks.push(escTextLine(line.title));
      chunks.push(
        escRow(
          `${line.quantity} x ${formatReceiptAmount(line.unitPrice)}`,
          formatReceiptAmount(line.lineAmount)
        )
      );
    }
  }

  chunks.push(escRule("."));
  chunks.push(escRow("รวม", formatReceiptAmount(subtotal)));
  chunks.push(escRow("ส่วนลด", formatReceiptAmount(0)));
  chunks.push(escRow("สุทธิ", formatReceiptAmount(netTotal), true));
  chunks.push(escRow("ชำระโดย", paymentLabel));
  if (isCash) {
    chunks.push(escRow("รับเงิน", formatReceiptAmount(netTotal)));
    chunks.push(escRow("เงินทอน", formatReceiptAmount(0)));
  }
  if (transaction.note?.trim()) {
    chunks.push(escRow("หมายเหตุ", transaction.note.trim()));
  }

  chunks.push(escRule("."));
  chunks.push(escCenterLines([footer]));
  chunks.push(escFeed(3));

  if (options?.openDrawer && isCash) {
    chunks.push(buildDrawerKickCommand({ pin: options.drawerPin ?? "pin2" }));
  }

  chunks.push(escCut());

  return escConcat(chunks);
}
