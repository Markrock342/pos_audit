import type {
  AuditLog,
  AuditLogAction,
  AuditLogEntityType,
  CashCount,
  CashDeposit,
  CashWithdrawal,
  Category,
  Organization,
  Transaction,
  TransactionLineItem,
  TransactionType,
} from "@/types";
import type { LineItemInput } from "@/lib/utils/lineAmount";

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
    lineItems: row.line_items as TransactionLineItem[] | undefined,
    sessionRound: row.session_round != null ? Number(row.session_round) : undefined,
  };
}

export function mapLineItem(row: Record<string, unknown>): TransactionLineItem {
  return {
    id: String(row.id),
    transactionId: String(row.transaction_id),
    sortOrder: Number(row.sort_order ?? 0),
    title: String(row.title),
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    lineAmount: Number(row.line_amount),
    categoryId: String(row.category_id),
  };
}

export function toLineItemInsert(
  transactionId: string,
  item: LineItemInput & { lineAmount: number; sortOrder: number }
) {
  return {
    transaction_id: transactionId,
    sort_order: item.sortOrder,
    title: item.title,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    line_amount: item.lineAmount,
    category_id: item.categoryId,
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
    financeConfig: row.finance_config as Organization["financeConfig"],
    createdAt: row.created_at as string | undefined,
  };
}

export function toOrganizationUpdate(
  data: Partial<Omit<Organization, "id" | "createdAt">>
) {
  const result: Record<string, unknown> = {};
  if (data.name !== undefined) result.name = data.name.trim();
  if (data.taxId !== undefined) {
    const v = data.taxId.trim();
    result.tax_id = v === "" ? null : v;
  }
  if (data.address !== undefined) {
    const v = data.address.trim();
    result.address = v === "" ? null : v;
  }
  if (data.phone !== undefined) {
    const v = data.phone.trim();
    result.phone = v === "" ? null : v;
  }
  if (data.currency !== undefined) result.currency = data.currency;
  if (data.receiptConfig !== undefined) {
    const header = data.receiptConfig.header?.trim() ?? "";
    const footer = data.receiptConfig.footer?.trim() ?? "";
    result.receipt_config = {
      header: header === "" ? null : header,
      footer: footer === "" ? null : footer,
    };
  }
  if (data.hardwareConfig !== undefined) result.hardware_config = data.hardwareConfig;
  if (data.financeConfig !== undefined) result.finance_config = data.financeConfig;
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
  data: Omit<Transaction, "id" | "createdAt" | "status" | "isPrinted"> & {
    sessionRound?: number;
  }
) {
  const row: Record<string, unknown> = {
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
  if (data.sessionRound != null) row.session_round = data.sessionRound;
  return row;
}

export function mapCashWithdrawal(row: Record<string, unknown>): CashWithdrawal {
  return {
    id: String(row.id),
    organizationId: row.organization_id as string | undefined,
    withdrawalDate: String(row.withdrawal_date),
    amount: Number(row.amount ?? 0),
    note: String(row.note ?? ""),
    recordedBy: row.recorded_by as string | undefined,
    createdAt: row.created_at as string | undefined,
    sessionRound: row.session_round != null ? Number(row.session_round) : undefined,
  };
}

export function mapCashDeposit(row: Record<string, unknown>): CashDeposit {
  return {
    id: String(row.id),
    organizationId: row.organization_id as string | undefined,
    depositDate: String(row.deposit_date),
    amount: Number(row.amount ?? 0),
    recordedBy: row.recorded_by as string | undefined,
    createdAt: row.created_at as string | undefined,
    sessionRound: row.session_round != null ? Number(row.session_round) : undefined,
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
    closedAt: row.closed_at as string | undefined,
    autoClosed: row.auto_closed as boolean | undefined,
    closingType: row.closing_type as CashCount["closingType"],
    hasManualCount: row.has_manual_count as boolean | undefined,
    updatedAt: row.updated_at as string | undefined,
    updatedBy: row.updated_by as string | undefined,
    openingTransfer: row.opening_transfer != null ? Number(row.opening_transfer) : undefined,
    cashIncome: row.cash_income != null ? Number(row.cash_income) : undefined,
    cashExpense: row.cash_expense != null ? Number(row.cash_expense) : undefined,
    cashWithdrawn: row.cash_withdrawn != null ? Number(row.cash_withdrawn) : undefined,
    closingCash: row.closing_cash != null ? Number(row.closing_cash) : undefined,
    transferIncome: row.transfer_income != null ? Number(row.transfer_income) : undefined,
    transferExpense: row.transfer_expense != null ? Number(row.transfer_expense) : undefined,
    closingTransfer: row.closing_transfer != null ? Number(row.closing_transfer) : undefined,
    totalIncome: row.total_income != null ? Number(row.total_income) : undefined,
    totalExpense: row.total_expense != null ? Number(row.total_expense) : undefined,
    netTotal: row.net_total != null ? Number(row.net_total) : undefined,
    closeEditGeneration:
      row.close_edit_generation != null ? Number(row.close_edit_generation) : undefined,
    closeEditReopenedAt: row.close_edit_reopened_at as string | undefined,
    closeSnapshot: row.close_snapshot as CashCount["closeSnapshot"],
    sessionRound: row.session_round != null ? Number(row.session_round) : undefined,
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

export function mapAuditLog(row: Record<string, unknown>): AuditLog {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    userId: row.user_id ? String(row.user_id) : undefined,
    entityType: row.entity_type as AuditLogEntityType,
    entityId: String(row.entity_id),
    transactionType: row.transaction_type as TransactionType | undefined,
    entityTitle: row.entity_title as string | undefined,
    action: row.action as AuditLogAction,
    reason: String(row.reason),
    oldValue: row.old_value as Record<string, unknown> | null | undefined,
    newValue: row.new_value as Record<string, unknown> | null | undefined,
    createdAt: String(row.created_at),
    closeEditGeneration:
      row.close_edit_generation != null ? Number(row.close_edit_generation) : undefined,
  };
}

export function toAuditLogInsert(input: {
  organizationId: string;
  userId?: string;
  entityType: AuditLogEntityType;
  entityId: string;
  transactionType?: TransactionType;
  entityTitle?: string;
  action: AuditLogAction;
  reason: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  closeEditGeneration?: number;
}) {
  return {
    organization_id: input.organizationId,
    user_id: input.userId ?? null,
    entity_type: input.entityType,
    entity_id: input.entityId,
    transaction_type: input.transactionType ?? null,
    entity_title: input.entityTitle ?? null,
    action: input.action,
    reason: input.reason.trim(),
    old_value: input.oldValue ?? null,
    new_value: input.newValue ?? null,
    close_edit_generation: input.closeEditGeneration ?? null,
    created_at: new Date().toISOString(),
  };
}
