import { z } from "zod";

/** schema สำหรับ API — รองรับตัวเลขจาก JSON (coerce + int) */
const apiLineItemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().int().positive(),
  categoryId: z.string().min(1),
  sortOrder: z.coerce.number().int().nonnegative().optional(),
});

export const postTransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  title: z.string().trim().min(1).max(200),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(["cash", "transfer", "cheque", "card", "other"]),
  transactionDate: z.string().min(1).optional(),
  referenceNo: z.string().max(100).optional(),
  createdBy: z.string().optional(),
  lineItems: z.array(apiLineItemSchema).min(1),
});

export const putTransactionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(["cash", "transfer", "cheque", "card", "other"]),
  transactionDate: z.string().min(1),
  referenceNo: z.string().max(100).optional(),
  editReason: z.string().trim().min(1, "editReason is required"),
  updatedBy: z.string().optional(),
  lineItems: z.array(apiLineItemSchema).min(1),
});
