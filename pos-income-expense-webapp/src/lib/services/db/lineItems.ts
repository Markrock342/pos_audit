import { getDb } from "@/lib/db/supabase";
import { mapLineItem, toLineItemInsert } from "@/lib/utils/dbMap";
import type { LineItemInput } from "@/lib/utils/lineAmount";
import { normalizeLineItems } from "@/lib/utils/lineAmount";
import type { TransactionLineItem } from "@/types";

const TABLE = "transaction_line_items";

export async function getLineItemsByTransactionIds(
  transactionIds: string[]
): Promise<Map<string, TransactionLineItem[]>> {
  const map = new Map<string, TransactionLineItem[]>();
  if (transactionIds.length === 0) return map;

  const { data, error } = await getDb()
    .from(TABLE)
    .select("*")
    .in("transaction_id", transactionIds)
    .order("sort_order", { ascending: true });

  if (error || !data) return map;

  for (const row of data as Record<string, unknown>[]) {
    const item = mapLineItem(row);
    const list = map.get(item.transactionId) ?? [];
    list.push(item);
    map.set(item.transactionId, list);
  }
  return map;
}

export async function getLineItemsForTransaction(
  transactionId: string
): Promise<TransactionLineItem[]> {
  const map = await getLineItemsByTransactionIds([transactionId]);
  return map.get(transactionId) ?? [];
}

export async function createLineItems(
  transactionId: string,
  items: LineItemInput[]
): Promise<TransactionLineItem[]> {
  const normalized = normalizeLineItems(items);
  if (normalized.length === 0) return [];

  const rows = normalized.map((item) =>
    toLineItemInsert(transactionId, item)
  );

  const { data, error } = await getDb().from(TABLE).insert(rows).select();
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapLineItem);
}

export async function replaceLineItems(
  transactionId: string,
  items: LineItemInput[]
): Promise<TransactionLineItem[]> {
  const { error: deleteError } = await getDb()
    .from(TABLE)
    .delete()
    .eq("transaction_id", transactionId);
  if (deleteError) throw deleteError;
  return createLineItems(transactionId, items);
}
