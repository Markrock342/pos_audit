import { getDb } from "@/lib/db/supabase";
import { mapCashWithdrawal } from "@/lib/utils/dbMap";
import { getSessionRoundForNewEntry } from "@/lib/utils/sessionRound";
import type { CashWithdrawal } from "@/types";

const TABLE = "cash_withdrawals";

export interface CashWithdrawalFilters {
  startDate?: string;
  endDate?: string;
  withdrawalDate?: string;
  sessionRound?: number;
}

export async function getCashWithdrawals(
  organizationId: string,
  filters?: CashWithdrawalFilters
): Promise<CashWithdrawal[]> {
  let query = getDb()
    .from(TABLE)
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (filters?.withdrawalDate) {
    query = query.eq("withdrawal_date", filters.withdrawalDate);
  }
  if (filters?.startDate) {
    query = query.gte("withdrawal_date", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("withdrawal_date", filters.endDate);
  }
  if (filters?.sessionRound != null) {
    query = query.eq("session_round", filters.sessionRound);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapCashWithdrawal);
}

export async function getTotalWithdrawnForDate(
  organizationId: string,
  withdrawalDate: string,
  sessionRound?: number
): Promise<number> {
  const rows = await getCashWithdrawals(organizationId, { withdrawalDate, sessionRound });
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

export async function getWithdrawalSummaryForDate(
  organizationId: string,
  withdrawalDate: string
): Promise<{ totalWithdrawn: number; count: number; items: CashWithdrawal[] }> {
  const items = await getCashWithdrawals(organizationId, { withdrawalDate });
  const totalWithdrawn = items.reduce((sum, row) => sum + row.amount, 0);
  return { totalWithdrawn, count: items.length, items };
}

export async function createCashWithdrawal(data: {
  organizationId: string;
  withdrawalDate: string;
  amount: number;
  note: string;
  recordedBy?: string;
}): Promise<CashWithdrawal> {
  const sessionRound = await getSessionRoundForNewEntry(data.organizationId, data.withdrawalDate);

  const { data: inserted, error } = await getDb()
    .from(TABLE)
    .insert({
      organization_id: data.organizationId,
      withdrawal_date: data.withdrawalDate,
      amount: data.amount,
      note: data.note.trim(),
      recorded_by: data.recordedBy ?? null,
      session_round: sessionRound,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return mapCashWithdrawal(inserted as Record<string, unknown>);
}
