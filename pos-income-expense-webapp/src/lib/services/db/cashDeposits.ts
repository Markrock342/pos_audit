import { getDb } from "@/lib/db/supabase";
import { mapCashDeposit } from "@/lib/utils/dbMap";
import { getSessionRoundForNewEntry } from "@/lib/utils/sessionRound";
import type { CashDeposit } from "@/types";

const TABLE = "cash_deposits";

export interface CashDepositFilters {
  startDate?: string;
  endDate?: string;
  depositDate?: string;
  sessionRound?: number;
}

export async function getCashDeposits(
  organizationId: string,
  filters?: CashDepositFilters
): Promise<CashDeposit[]> {
  let query = getDb()
    .from(TABLE)
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (filters?.depositDate) {
    query = query.eq("deposit_date", filters.depositDate);
  }
  if (filters?.startDate) {
    query = query.gte("deposit_date", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("deposit_date", filters.endDate);
  }
  if (filters?.sessionRound != null) {
    query = query.eq("session_round", filters.sessionRound);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapCashDeposit);
}

export async function getTotalDepositedForDate(
  organizationId: string,
  depositDate: string,
  sessionRound?: number
): Promise<number> {
  let query = getDb()
    .from(TABLE)
    .select("amount")
    .eq("organization_id", organizationId)
    .eq("deposit_date", depositDate);

  if (sessionRound != null) {
    query = query.eq("session_round", sessionRound);
  }

  const { data, error } = await query;

  if (error || !data) return 0;
  return (data as { amount: number }[]).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
}

export async function createCashDeposit(data: {
  organizationId: string;
  depositDate: string;
  amount: number;
  recordedBy?: string;
}): Promise<CashDeposit> {
  const sessionRound = await getSessionRoundForNewEntry(data.organizationId, data.depositDate);

  const { data: inserted, error } = await getDb()
    .from(TABLE)
    .insert({
      organization_id: data.organizationId,
      deposit_date: data.depositDate,
      amount: data.amount,
      recorded_by: data.recordedBy ?? null,
      session_round: sessionRound,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return mapCashDeposit(inserted as Record<string, unknown>);
}
