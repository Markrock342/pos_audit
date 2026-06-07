import { getDb } from "@/lib/db/supabase";
import { mapTransaction, toTransactionInsert } from "@/lib/utils/dbMap";
import type { Transaction, TransactionType } from "@/types";

const TABLE = "transactions";

export async function getTransaction(id: string): Promise<Transaction | null> {
  const { data, error } = await getDb()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapTransaction(data as Record<string, unknown>);
}

export async function getTransactions(
  organizationId: string,
  filters?: {
    type?: TransactionType;
    status?: "active" | "void";
    startDate?: string;
    endDate?: string;
  }
): Promise<Transaction[]> {
  let q = getDb()
    .from(TABLE)
    .select("*")
    .eq("organization_id", organizationId)
    .order("transaction_date", { ascending: false });

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

  const { data, error } = await q;
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapTransaction);
}

export async function createTransaction(
  data: Omit<Transaction, "id" | "createdAt" | "status" | "isPrinted">
): Promise<Transaction> {
  const { data: inserted, error } = await getDb()
    .from(TABLE)
    .insert(toTransactionInsert(data))
    .select()
    .single();
  if (error) throw error;
  return mapTransaction(inserted as Record<string, unknown>);
}

export async function updateTransaction(
  id: string,
  data: Partial<Omit<Transaction, "id" | "createdAt" | "createdBy">>
): Promise<Transaction> {
  const { data: updated, error } = await getDb()
    .from(TABLE)
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return updated as Transaction;
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
  return updated as Transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await getDb().from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
