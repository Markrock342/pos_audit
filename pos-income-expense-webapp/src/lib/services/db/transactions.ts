import { getDb } from "@/lib/db/supabase";
import { mapTransaction, toTransactionInsert, toTransactionUpdate } from "@/lib/utils/dbMap";
import {
  createLineItems,
  getLineItemsByTransactionIds,
  getLineItemsForTransaction,
  replaceLineItems,
} from "@/lib/services/db/lineItems";
import type { LineItemInput } from "@/lib/utils/lineAmount";
import { sumLineAmounts } from "@/lib/utils/lineAmount";
import type { Transaction, TransactionType } from "@/types";

const TABLE = "transactions";

function attachLineItems(
  transactions: Transaction[],
  lineMap: Map<string, Transaction["lineItems"]>
): Transaction[] {
  return transactions.map((t) => ({
    ...t,
    lineItems: lineMap.get(t.id) ?? [],
  }));
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const { data, error } = await getDb()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  const txn = mapTransaction(data as Record<string, unknown>);
  const lineItems = await getLineItemsForTransaction(id);
  return { ...txn, lineItems };
}

export async function getTransactions(
  organizationId: string,
  filters?: {
    type?: TransactionType;
    status?: "active" | "void";
    startDate?: string;
    endDate?: string;
  },
  options?: {
    includeLineItems?: boolean;
    limit?: number;
  }
): Promise<Transaction[]> {
  let q = getDb()
    .from(TABLE)
    .select("*")
    .eq("organization_id", organizationId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.type) {
    q = q.eq("type", filters.type);
  }
  if (filters?.status) {
    q = q.eq("status", filters.status);
  }
  if (filters?.startDate) {
    q = q.gte("transaction_date", filters.startDate);
  }
  if (filters?.endDate) {
    q = q.lte("transaction_date", filters.endDate);
  }
  if (options?.limit) {
    q = q.limit(options.limit);
  }

  const { data, error } = await q;
  if (error || !data) return [];
  const transactions = (data as Record<string, unknown>[]).map(mapTransaction);

  if (options?.includeLineItems === false) {
    return transactions.map((t) => ({ ...t, lineItems: [] }));
  }

  const lineMap = await getLineItemsByTransactionIds(transactions.map((t) => t.id));
  return attachLineItems(transactions, lineMap);
}

export async function createTransaction(
  data: Omit<Transaction, "id" | "createdAt" | "status" | "isPrinted" | "lineItems">,
  lineItems: LineItemInput[]
): Promise<Transaction> {
  const normalized = lineItems.map((item, index) => ({ ...item, sortOrder: item.sortOrder ?? index }));
  const totalAmount = sumLineAmounts(
    normalized.map((item) => Math.round(item.quantity * item.unitPrice * 100) / 100)
  );
  const firstCategoryId = normalized[0]?.categoryId ?? data.categoryId;

  const { data: inserted, error } = await getDb()
    .from(TABLE)
    .insert(
      toTransactionInsert({
        ...data,
        amount: totalAmount,
        categoryId: firstCategoryId,
      })
    )
    .select()
    .single();
  if (error) throw error;

  const txn = mapTransaction(inserted as Record<string, unknown>);
  try {
    const items = await createLineItems(txn.id, normalized);
    return { ...txn, amount: totalAmount, categoryId: firstCategoryId, lineItems: items };
  } catch (lineErr) {
    await getDb().from(TABLE).delete().eq("id", txn.id);
    throw lineErr;
  }
}

export async function updateTransaction(
  id: string,
  data: Partial<Omit<Transaction, "id" | "createdAt" | "createdBy" | "lineItems">>,
  lineItems?: LineItemInput[]
): Promise<Transaction> {
  let patch = { ...data };

  if (lineItems && lineItems.length > 0) {
    const normalized = lineItems.map((item, index) => ({ ...item, sortOrder: item.sortOrder ?? index }));
    patch = {
      ...patch,
      amount: sumLineAmounts(
        normalized.map((item) => Math.round(item.quantity * item.unitPrice * 100) / 100)
      ),
      categoryId: normalized[0].categoryId,
    };
  }

  const { data: updated, error } = await getDb()
    .from(TABLE)
    .update(toTransactionUpdate(patch))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  const txn = mapTransaction(updated as Record<string, unknown>);
  const items =
    lineItems && lineItems.length > 0
      ? await replaceLineItems(id, lineItems)
      : await getLineItemsForTransaction(id);
  return { ...txn, lineItems: items };
}

export async function voidTransaction(
  id: string,
  voidReason: string,
  voidedBy: string
): Promise<Transaction> {
  const { data: updated, error } = await getDb()
    .from(TABLE)
    .update({
      status: "void",
      void_reason: voidReason,
      voided_by: voidedBy,
      voided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  const txn = mapTransaction(updated as Record<string, unknown>);
  const lineItems = await getLineItemsForTransaction(id);
  return { ...txn, lineItems };
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await getDb().from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
