import { z } from "zod";

export const lineItemSchema = z.object({
  title: z.string().trim().min(1, "กรุณาระบุชื่อรายการ").max(200),
  quantity: z.number().int().positive("จำนวนต้องเป็นจำนวนเต็มและมากกว่า 0"),
  unitPrice: z.number().int().positive("กรุณาระบุราคาต่อหน่วย (จำนวนเต็ม)"),
  categoryId: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  sortOrder: z.number().int().nonnegative().optional(),
});

export type LineItemFormValues = z.infer<typeof lineItemSchema>;

/** ฟอร์มบันทึก — หลายรายการ + ข้อมูลหัวใบ */
export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  title: z.string().trim().max(200).optional(),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(["cash", "transfer", "cheque", "card", "other"]),
  transactionDate: z.string().min(1, "กรุณาระบุวันที่"),
  referenceNo: z.string().max(100).optional(),
  lineItems: z.array(lineItemSchema).min(1, "ต้องมีอย่างน้อย 1 รายการ"),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export function emptyLineItem(): LineItemFormValues {
  return {
    title: "",
    quantity: 1,
    unitPrice: 0,
    categoryId: "",
  };
}

export function resolveBillTitle(
  type: "income" | "expense",
  title: string | undefined,
  lineItems: LineItemFormValues[]
): string {
  const trimmed = title?.trim();
  if (trimmed) return trimmed;
  if (lineItems.length === 1) return lineItems[0].title;
  const label = type === "income" ? "รายรับ" : "รายจ่าย";
  return `${label} ${lineItems.length} รายการ`;
}

export function transactionToFormValues(transaction: {
  title?: string;
  type?: "income" | "expense";
  categoryId?: string;
  amount?: number;
  lineItems?: Array<{
    title: string;
    quantity: number;
    unitPrice: number;
    categoryId: string;
    lineAmount?: number;
  }>;
}): Pick<TransactionFormValues, "title" | "lineItems"> {
  if (transaction.lineItems && transaction.lineItems.length > 0) {
    return {
      title: transaction.title ?? "",
      lineItems: transaction.lineItems.map((item, index) => ({
        title: item.title,
        quantity: Math.round(item.quantity),
        unitPrice: Math.round(item.unitPrice),
        categoryId: item.categoryId,
        sortOrder: index,
      })),
    };
  }
  return {
    title: transaction.title ?? "",
    lineItems: [
      {
        title: transaction.title ?? "",
        quantity: 1,
        unitPrice: Math.round(transaction.amount ?? 0),
        categoryId: transaction.categoryId ?? "",
        sortOrder: 0,
      },
    ],
  };
}

/** @deprecated ใช้ lineItems โดยตรง */
export function transactionToSimpleForm(transaction: Parameters<typeof transactionToFormValues>[0]) {
  const { title, lineItems } = transactionToFormValues(transaction);
  const first = lineItems[0];
  return {
    title: first?.title || title || "",
    categoryId: first?.categoryId ?? "",
    amount: first ? first.quantity * first.unitPrice : 0,
  };
}
