import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  title: z.string().min(1, "กรุณากรอกรายการ").max(100),
  amount: z.number().positive("จำนวนเงินต้องมากกว่า 0"),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(["cash", "transfer", "cheque", "card", "other"]),
  transactionDate: z.string().min(1, "กรุณาระบุวันที่"),
  referenceNo: z.string().max(100).optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
