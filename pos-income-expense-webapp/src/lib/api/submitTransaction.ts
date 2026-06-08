import { createTransactionApi } from "@/lib/api/client";
import { KIOSK_ACCOUNTS, KIOSK_SESSION_KEY, type KioskSession } from "@/constants/kioskUsers";
import type { TransactionFormValues } from "@/lib/validations/transaction";

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
    categoryId: data.categoryId,
    title: data.title,
    amount: data.amount,
    note: data.note,
    paymentMethod: data.paymentMethod,
    transactionDate: data.transactionDate ?? new Date().toISOString().slice(0, 10),
    createdBy: getCreatedBy(),
  });
}
