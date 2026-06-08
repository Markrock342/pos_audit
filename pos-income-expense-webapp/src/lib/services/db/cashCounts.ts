import { getDb } from "@/lib/db/supabase";
import { getTransactions } from "./transactions";
import type { CashCount, CashCountStatus } from "@/types";

const TABLE = "cash_counts";

export async function calculateExpectedBalance(
  organizationId: string,
  countDate: string,
  openingBalance: number
): Promise<number> {
  const transactions = await getTransactions(organizationId, {
    status: "active",
    startDate: countDate,
    endDate: countDate,
  });

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return openingBalance + income - expense;
}

function determineStatus(variance: number): CashCountStatus {
  if (variance === 0) return "balanced";
  if (variance < 0) return "short";
  return "overage";
}

export async function getCashCount(id: string): Promise<CashCount | null> {
  const { data, error } = await getDb()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as CashCount;
}

export async function getCashCounts(organizationId: string): Promise<CashCount[]> {
  const { data, error } = await getDb()
    .from(TABLE)
    .select("*")
    .eq("organization_id", organizationId)
    .order("count_date", { ascending: false });
  if (error || !data) return [];
  return data as CashCount[];
}

export async function getCashCountByDate(
  organizationId: string,
  countDate: string
): Promise<CashCount | null> {
  const { data, error } = await getDb()
    .from(TABLE)
    .select("*")
    .eq("organization_id", organizationId)
    .eq("count_date", countDate)
    .single();
  if (error || !data) return null;
  return data as CashCount;
}

export async function createCashCount(
  data: Omit<CashCount, "id" | "expectedBalance" | "variance" | "status" | "createdAt">
): Promise<CashCount> {
  const expectedBalance = await calculateExpectedBalance(
    data.organizationId ?? "",
    data.countDate,
    data.openingBalance
  );

  const variance = data.actualBalance - expectedBalance;
  const status = determineStatus(variance);

  const cashCount = {
    ...data,
    expected_balance: expectedBalance,
    variance,
    status,
    created_at: new Date().toISOString(),
  };

  const { data: inserted, error } = await getDb()
    .from(TABLE)
    .insert(cashCount)
    .select()
    .single();
  if (error) throw error;
  return inserted as CashCount;
}

export async function updateCashCount(
  id: string,
  data: Partial<Pick<CashCount, "actualBalance" | "openingBalance" | "countDate" | "note">>
): Promise<CashCount> {
  const existing = await getCashCount(id);
  if (!existing) throw new Error("Cash count not found");

  const openingBalance = data.openingBalance ?? existing.openingBalance;
  const countDate = data.countDate ?? existing.countDate;
  const actualBalance = data.actualBalance ?? existing.actualBalance;

  const expectedBalance = await calculateExpectedBalance(
    existing.organizationId ?? "",
    countDate,
    openingBalance
  );

  const variance = actualBalance - expectedBalance;
  const status = determineStatus(variance);

  const { data: updated, error } = await getDb()
    .from(TABLE)
    .update({
      ...data,
      expected_balance: expectedBalance,
      variance,
      status,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return updated as CashCount;
}

export async function deleteCashCount(id: string): Promise<void> {
  const { error } = await getDb().from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
