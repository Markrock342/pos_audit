import type { Category, Transaction } from "@/types";

/** แปลง snake_case จาก Supabase → camelCase สำหรับ frontend */
export function mapTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: String(row.id),
    organizationId: row.organization_id as string | undefined,
    type: row.type as Transaction["type"],
    categoryId: String(row.category_id),
    title: String(row.title),
    amount: Number(row.amount),
    note: row.note as string | undefined,
    paymentMethod: row.payment_method as Transaction["paymentMethod"],
    referenceNo: row.reference_no as string | undefined,
    transactionDate: String(row.transaction_date),
    status: row.status as Transaction["status"],
    voidReason: row.void_reason as string | undefined,
    voidedAt: row.voided_at as string | undefined,
    voidedBy: row.voided_by as string | undefined,
    receiptNo: row.receipt_no as string | undefined,
    isPrinted: Boolean(row.is_printed),
    createdBy: String(row.created_by ?? ""),
    createdAt: String(row.created_at ?? row.transaction_date),
    updatedBy: row.updated_by as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    organizationId: row.organization_id as string | undefined,
    name: String(row.name),
    type: row.type as Category["type"],
    color: String(row.color ?? "#708090"),
    sortOrder: row.sort_order as number | undefined,
    isActive: row.is_active as boolean | undefined,
    createdAt: row.created_at as string | undefined,
  };
}

export function toTransactionInsert(
  data: Omit<Transaction, "id" | "createdAt" | "status" | "isPrinted">
) {
  return {
    organization_id: data.organizationId,
    type: data.type,
    category_id: data.categoryId,
    title: data.title,
    amount: data.amount,
    note: data.note ?? null,
    payment_method: data.paymentMethod,
    reference_no: data.referenceNo ?? null,
    transaction_date: data.transactionDate,
    status: "active",
    is_printed: false,
    created_by: data.createdBy || null,
    created_at: new Date().toISOString(),
  };
}
