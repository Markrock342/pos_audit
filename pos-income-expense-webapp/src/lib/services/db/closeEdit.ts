import { getDb } from "@/lib/db/supabase";
import { canReopenCloseForEdit, isInCloseEditMode } from "@/lib/utils/closeEditUtils";
import { getBusinessToday } from "@/lib/utils/businessDate";
import { getCashCountByDate } from "./cashCounts";
import type { CreateAuditLogInput } from "./auditLogs";
import { getCloseEditAuditLogsForDate } from "./auditLogs";
import type { AuditLog, CashCount, CashCountCloseEvent, CloseSnapshot, DailyLedgerSummary } from "@/types";

export interface CloseHistoryForDate {
  events: CashCountCloseEvent[];
  editAudits: AuditLog[];
  inEditMode: boolean;
  currentGeneration?: number;
}

function syntheticCloseEvent(cashCount: CashCount): CashCountCloseEvent | null {
  if (!cashCount.closedAt) return null;
  return {
    id: `legacy-close-${cashCount.id}`,
    organizationId: cashCount.organizationId ?? "",
    cashCountId: cashCount.id,
    countDate: cashCount.countDate,
    eventType: "close",
    closeEditGeneration: cashCount.closeEditGeneration ?? 1,
    expectedBalance: cashCount.expectedBalance,
    actualBalance: cashCount.actualBalance,
    variance: cashCount.variance,
    closingCash: cashCount.closingCash,
    clearDrawerAmount: cashCount.closeSnapshot?.clearDrawerAmount,
    createdAt: cashCount.closedAt,
  };
}

export { canReopenCloseForEdit, isInCloseEditMode } from "@/lib/utils/closeEditUtils";

export function buildCloseSnapshot(input: {
  ledger: DailyLedgerSummary;
  expectedBalance: number;
  actualBalance: number;
  variance: number;
  status: string;
  clearDrawerAmount: number;
  clearDrawerWithdrawalId?: string | null;
  cashWithdrawnBeforeClear: number;
}): CloseSnapshot {
  const { ledger } = input;
  return {
    expectedBalance: input.expectedBalance,
    actualBalance: input.actualBalance,
    variance: input.variance,
    status: input.status,
    closingCash: ledger.cash.closing,
    cashIncome: ledger.cash.income,
    cashExpense: ledger.cash.expense,
    cashWithdrawn: input.cashWithdrawnBeforeClear,
    cashDeposited: ledger.cash.deposited,
    transferIncome: ledger.transfer.income,
    transferExpense: ledger.transfer.expense,
    closingTransfer: ledger.transfer.closing,
    totalIncome: ledger.business.totalIncome,
    totalExpense: ledger.business.totalExpense,
    netTotal: ledger.business.netTotal,
    clearDrawerAmount: input.clearDrawerAmount,
    clearDrawerWithdrawalId: input.clearDrawerWithdrawalId ?? null,
  };
}

export async function getCloseEditAuditGeneration(
  organizationId: string,
  countDate: string
): Promise<number | undefined> {
  const row = await getCashCountByDate(organizationId, countDate);
  if (!row?.closeEditReopenedAt) return undefined;
  return row.closeEditGeneration ?? 0;
}

/** แนบ close_edit_generation ให้ audit ระหว่างเปิดแก้ไขปิดยอด */
export async function withCloseEditAuditMeta(
  organizationId: string,
  businessDate: string,
  input: CreateAuditLogInput
): Promise<CreateAuditLogInput> {
  const closeEditGeneration = await getCloseEditAuditGeneration(organizationId, businessDate);
  if (closeEditGeneration === undefined) return input;
  return { ...input, closeEditGeneration };
}

export async function recordCloseEvent(
  cashCountId: string,
  eventType: CashCountCloseEvent["eventType"],
  options?: {
    clearDrawerWithdrawalId?: string | null;
    clearDrawerAmount?: number;
    userId?: string;
    note?: string;
  }
): Promise<void> {
  const { error } = await getDb().rpc("fn_record_close_event", {
    p_cash_count_id: cashCountId,
    p_event_type: eventType,
    p_clear_drawer_withdrawal_id: options?.clearDrawerWithdrawalId ?? null,
    p_clear_drawer_amount: options?.clearDrawerAmount ?? null,
    p_user_id: options?.userId ?? null,
    p_note: options?.note ?? null,
  });

  if (error) {
    if (
      error.message.includes("Could not find the function") ||
      error.message.includes("schema cache")
    ) {
      console.warn("[closeEdit] fn_record_close_event not deployed — skip event log");
      return;
    }
    throw error;
  }
}

export async function reopenCloseForEdit(
  organizationId: string,
  options?: { userId?: string; countDate?: string }
): Promise<{
  reopened: boolean;
  alreadyOpen?: boolean;
  cashCount: CashCount | null;
  restoredClosingCash?: number;
}> {
  const countDate = options?.countDate ?? getBusinessToday();

  const { data, error } = await getDb().rpc("fn_reopen_close_for_edit", {
    p_organization_id: organizationId,
    p_count_date: countDate,
    p_user_id: options?.userId ?? null,
  });

  if (error) {
    if (
      error.message.includes("Could not find the function") ||
      error.message.includes("schema cache")
    ) {
      throw new Error(
        "ยังไม่ได้รัน SQL แก้ไขปิดยอด — รัน docs/supabase-close-edit-reopen.sql ใน Supabase"
      );
    }
    throw new Error(error.message);
  }

  const payload = data as {
    already_open?: boolean;
    reopened_for_edit?: boolean;
    restored_closing_cash?: number;
  };

  const cashCount = await getCashCountByDate(organizationId, countDate);

  if (payload.already_open) {
    return { reopened: false, alreadyOpen: true, cashCount };
  }

  return {
    reopened: !!payload.reopened_for_edit,
    cashCount,
    restoredClosingCash: payload.restored_closing_cash,
  };
}

function mapCloseEvent(row: Record<string, unknown>): CashCountCloseEvent {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    cashCountId: String(row.cash_count_id),
    countDate: String(row.count_date),
    eventType: row.event_type as CashCountCloseEvent["eventType"],
    closeEditGeneration: Number(row.close_edit_generation ?? 0),
    expectedBalance: row.expected_balance != null ? Number(row.expected_balance) : undefined,
    actualBalance: row.actual_balance != null ? Number(row.actual_balance) : undefined,
    variance: row.variance != null ? Number(row.variance) : undefined,
    closingCash: row.closing_cash != null ? Number(row.closing_cash) : undefined,
    clearDrawerAmount:
      row.clear_drawer_amount != null ? Number(row.clear_drawer_amount) : undefined,
    clearDrawerWithdrawalId: row.clear_drawer_withdrawal_id as string | undefined,
    note: row.note as string | undefined,
    userId: row.user_id as string | undefined,
    createdAt: String(row.created_at),
  };
}

export async function getCloseEventsForDate(
  organizationId: string,
  countDate: string
): Promise<CashCountCloseEvent[]> {
  const { data, error } = await getDb()
    .from("cash_count_close_events")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("count_date", countDate)
    .order("created_at", { ascending: true });

  if (error) {
    if (error.message.includes("does not exist") || error.code === "42P01") {
      return [];
    }
    throw error;
  }

  return (data as Record<string, unknown>[]).map(mapCloseEvent);
}

export async function getCloseHistoryForDate(
  organizationId: string,
  countDate: string
): Promise<CloseHistoryForDate> {
  const [events, editAudits, cashCount] = await Promise.all([
    getCloseEventsForDate(organizationId, countDate),
    getCloseEditAuditLogsForDate(organizationId, countDate),
    getCashCountByDate(organizationId, countDate),
  ]);

  let resolvedEvents = events;
  if (
    resolvedEvents.length === 0 &&
    cashCount?.closedAt &&
    !isInCloseEditMode(cashCount)
  ) {
    const legacy = syntheticCloseEvent(cashCount);
    if (legacy) resolvedEvents = [legacy];
  }

  return {
    events: resolvedEvents,
    editAudits,
    inEditMode: isInCloseEditMode(cashCount),
    currentGeneration: cashCount?.closeEditGeneration,
  };
}

export async function getCloseEventsForCashCount(
  cashCountId: string
): Promise<CashCountCloseEvent[]> {
  const { data, error } = await getDb()
    .from("cash_count_close_events")
    .select("*")
    .eq("cash_count_id", cashCountId)
    .order("created_at", { ascending: true });

  if (error) {
    if (error.message.includes("does not exist") || error.code === "42P01") {
      return [];
    }
    throw error;
  }

  return (data as Record<string, unknown>[]).map(mapCloseEvent);
}
