import { createTransactionApi } from "@/lib/api/client";
import { KIOSK_ACCOUNTS, KIOSK_SESSION_KEY, type KioskSession } from "@/constants/kioskUsers";
import {
  resolveBillTitle,
  type TransactionFormValues,
} from "@/lib/validations/transaction";

function getCreatedBy(): string {
  if (typeof window === "undefined") {
    return KIOSK_ACCOUNTS.find((a) => a.type === "customer")!.userId;
  }
  try {
    const raw = localStorage.getItem(KIOSK_SESSION_KEY);
    if (raw) return (JSON.parse(raw) as KioskSession).userId;
  } catch {}
  return KIOSK_ACCOUNTS.find((a) => a.type === "customer")!.userId;
}

export async function submitTransaction(data: TransactionFormValues) {
  return createTransactionApi({
    type: data.type,
    title: resolveBillTitle(data.type, data.title, data.lineItems),
    note: data.note?.trim() || undefined,
    paymentMethod: data.paymentMethod,
    transactionDate: data.transactionDate ?? new Date().toISOString().slice(0, 10),
    lineItems: data.lineItems.map((item, index) => ({
      title: item.title.trim(),
      quantity: Math.round(item.quantity),
      unitPrice: Math.round(item.unitPrice),
      categoryId: item.categoryId,
      sortOrder: index,
    })),
    createdBy: getCreatedBy(),
  });
}
