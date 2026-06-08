import type { CashCount, Category, Organization, Transaction } from "@/types";

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

export function mapOrganization(row: Record<string, unknown>): Organization {
  return {
    id: String(row.id),
    name: String(row.name),
    taxId: row.tax_id as string | undefined,
    address: row.address as string | undefined,
    phone: row.phone as string | undefined,
    currency: String(row.currency ?? "THB"),
    receiptConfig: row.receipt_config as Organization["receiptConfig"],
    hardwareConfig: row.hardware_config as Organization["hardwareConfig"],
    createdAt: row.created_at as string | undefined,
  };
}

export function toOrganizationUpdate(
  data: Partial<Omit<Organization, "id" | "createdAt">>
) {
  const result: Record<string, unknown> = {};
  if (data.name !== undefined) result.name = data.name;
  if (data.taxId !== undefined) result.tax_id = data.taxId;
  if (data.address !== undefined) result.address = data.address;
  if (data.phone !== undefined) result.phone = data.phone;
  if (data.currency !== undefined) result.currency = data.currency;
  if (data.receiptConfig !== undefined) result.receipt_config = data.receiptConfig;
  if (data.hardwareConfig !== undefined) result.hardware_config = data.hardwareConfig;
  return result;
}

export function toTransactionUpdate(
  data: Partial<Omit<Transaction, "id" | "createdAt" | "createdBy">>
) {
  const patch: Record<string, unknown> = {};
  if (data.title !== undefined) patch.title = data.title;
  if (data.amount !== undefined) patch.amount = data.amount;
  if (data.categoryId !== undefined) patch.category_id = data.categoryId;
  if (data.note !== undefined) patch.note = data.note;
  if (data.paymentMethod !== undefined) patch.payment_method = data.paymentMethod;
  if (data.referenceNo !== undefined) patch.reference_no = data.referenceNo;
  if (data.transactionDate !== undefined) patch.transaction_date = data.transactionDate;
  if (data.updatedBy !== undefined) patch.updated_by = data.updatedBy;
  patch.updated_at = new Date().toISOString();
  return patch;
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

export function mapCashCount(row: Record<string, unknown>): CashCount {
  return {
    id: String(row.id),
    organizationId: row.organization_id as string | undefined,
    countedBy: String(row.counted_by ?? ""),
    countDate: String(row.count_date),
    openingBalance: Number(row.opening_balance ?? 0),
    expectedBalance: Number(row.expected_balance ?? 0),
    actualBalance: Number(row.actual_balance ?? 0),
    variance: Number(row.variance ?? 0),
    status: row.status as CashCount["status"],
    note: row.note as string | undefined,
    createdAt: row.created_at as string | undefined,
  };
}

export function toCashCountInsert(
  data: Omit<CashCount, "id" | "expectedBalance" | "variance" | "status" | "createdAt">,
  computed: { expectedBalance: number; variance: number; status: CashCount["status"] }
) {
  return {
    organization_id: data.organizationId,
    counted_by: data.countedBy || null,
    count_date: data.countDate,
    opening_balance: data.openingBalance,
    actual_balance: data.actualBalance,
    expected_balance: computed.expectedBalance,
    variance: computed.variance,
    status: computed.status,
    note: data.note ?? null,
    created_at: new Date().toISOString(),
  };
}

export function toCategoryInsert(data: Omit<Category, "id" | "createdAt">) {
  return {
    organization_id: data.organizationId,
    name: data.name,
    type: data.type,
    color: data.color,
    sort_order: data.sortOrder ?? 0,
    is_active: data.isActive ?? true,
    created_at: new Date().toISOString(),
  };
}
