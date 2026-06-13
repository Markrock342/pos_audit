import { fetchOrganization } from "@/lib/api/client";
import { printReceipt } from "@/lib/hardware/printer";
import { KIOSK_SESSION_KEY, type KioskSession } from "@/constants/kioskUsers";
import {
  resolveExpenseVoucherNumber,
  resolveReceiptNumber,
} from "@/lib/utils/receiptFormat";
import type { Category, Transaction } from "@/types";
import type { PrintReceiptResult } from "@/lib/hardware/printer";

function readSessionDisplayName(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(KIOSK_SESSION_KEY);
    if (!raw) return undefined;
    return (JSON.parse(raw) as KioskSession).displayName;
  } catch {
    return undefined;
  }
}

/** พิมพ์ใบเสร็จ/ใบบันทึกรายจ่ายทันทีหลังบันทึกรายการ */
export async function printTransactionDocument(
  transaction: Transaction,
  options?: { categories?: Category[] }
): Promise<PrintReceiptResult> {
  const org = await fetchOrganization().catch(() => null);
  const shopName = org?.receiptConfig?.header ?? org?.name;
  const footer = org?.receiptConfig?.footer;
  const displayName = readSessionDisplayName();

  if (transaction.type === "expense") {
    const voucherNumber = resolveExpenseVoucherNumber(transaction);
    const categoryNames = options?.categories
      ? Object.fromEntries(options.categories.map((c) => [c.id, c.name]))
      : undefined;

    return printReceipt(
      transaction,
      {
        id: transaction.id,
        transactionId: transaction.id,
        receiptNumber: voucherNumber,
      },
      {
        openDrawer: false,
        shopName,
        footer,
        recorderName: displayName,
        voucherNumber,
        categoryNames,
      }
    );
  }

  return printReceipt(
    transaction,
    {
      id: transaction.id,
      transactionId: transaction.id,
      receiptNumber: resolveReceiptNumber(transaction),
    },
    {
      openDrawer: transaction.paymentMethod === "cash",
      shopName,
      footer,
      sellerName: displayName,
    }
  );
}
