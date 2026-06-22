import { getBusinessToday } from "@/lib/utils/businessDate";
import type { LineItemFormValues } from "@/lib/validations/transaction";
import { resolveBillTitle } from "@/lib/validations/transaction";
import { computeLineAmount, sumLineAmounts } from "@/lib/utils/lineAmount";
import type {
  PaymentMethod,
  Transaction,
  TransactionLineItem,
  TransactionType,
} from "@/types";

export function hasDraftActivity(draft: LineItemFormValues | null | undefined): boolean {
  if (!draft) return false;
  return !!(draft.categoryId || draft.unitPrice > 0 || draft.quantity !== 1);
}

export function buildDraftTransaction(params: {
  type: TransactionType;
  cartLines: LineItemFormValues[];
  draftLine?: LineItemFormValues | null;
  billTitle?: string;
  paymentMethod: PaymentMethod;
  transactionDate: string;
  note?: string;
}): Transaction | null {
  const { type, cartLines, draftLine, billTitle, paymentMethod, transactionDate, note } =
    params;

  const entries: Array<{ line: LineItemFormValues; isDraft: boolean }> = cartLines.map(
    (line) => ({ line, isDraft: false })
  );
  if (draftLine && hasDraftActivity(draftLine)) {
    entries.push({ line: draftLine, isDraft: true });
  }
  const trimmedBillTitle = billTitle?.trim();
  const trimmedNote = note?.trim();

  if (entries.length === 0) {
    if (!trimmedBillTitle && !trimmedNote) return null;
    const txDate = transactionDate || getBusinessToday();
    return {
      id: "draft",
      type,
      categoryId: "",
      title: trimmedBillTitle || (type === "income" ? "รายรับ" : "รายจ่าย"),
      amount: 0,
      note: trimmedNote || undefined,
      paymentMethod,
      transactionDate: txDate,
      status: "active",
      isPrinted: false,
      createdBy: "",
      createdAt: new Date().toISOString(),
      lineItems: [],
    };
  }

  const lineItems: TransactionLineItem[] = entries.map(({ line, isDraft }, index) => {
    const lineAmount = computeLineAmount(line.quantity, line.unitPrice);
    return {
      id: `draft-line-${index}`,
      transactionId: "draft",
      sortOrder: index,
      title: isDraft && line.unitPrice > 0 ? `${line.title} (ร่าง)` : line.title,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineAmount,
      categoryId: line.categoryId || cartLines[0]?.categoryId || "",
    };
  });

  const amount = sumLineAmounts(lineItems.map((l) => l.lineAmount));
  const formLines = entries.map((e) => e.line);
  const title = resolveBillTitle(type, billTitle, formLines);
  const txDate = transactionDate || getBusinessToday();

  return {
    id: "draft",
    type,
    categoryId: lineItems[0].categoryId,
    title,
    amount,
    note: note?.trim() || undefined,
    paymentMethod,
    transactionDate: txDate,
    status: "active",
    isPrinted: false,
    createdBy: "",
    createdAt: new Date().toISOString(),
    lineItems,
  };
}
