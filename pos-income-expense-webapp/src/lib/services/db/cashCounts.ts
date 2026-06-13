import { getDb } from "@/lib/db/supabase";
import { mapCashCount, toCashCountInsert } from "@/lib/utils/dbMap";
import {
  getBusinessToday,
  getBusinessYesterday,
  isPastBusinessDate,
} from "@/lib/utils/businessDate";
import { getTransactions } from "./transactions";
import { getTotalWithdrawnForDate } from "./cashWithdrawals";
import { getDailyLedgerSummary, ledgerPatchFromSummary } from "./dailyLedger";
import type { CashCount, CashCountStatus } from "@/types";

const TABLE = "cash_counts";

const AUTO_CLOSE_NOTE =
  "ปิดอัตโนมัติ — ไม่ได้นับเงินจริง (ใช้ยอดคาดหวัง)";
const AUTO_CLOSE_SAVED_NOTE = "ปิดอัตโนมัติ — ใช้ยอดที่บันทึกไว้";

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
    .filter((t) => t.type === "income" && t.paymentMethod === "cash")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === "expense" && t.paymentMethod === "cash")
    .reduce((sum, t) => sum + t.amount, 0);

  const withdrawn = await getTotalWithdrawnForDate(organizationId, countDate);

  return openingBalance + income - expense - withdrawn;
}

function determineStatus(variance: number): CashCountStatus {
  if (variance === 0) return "balanced";
  if (variance < 0) return "short";
  return "overage";
}

function appendNote(existing: string | undefined, addition: string): string {
  if (!existing?.trim()) return addition;
  if (existing.includes(addition)) return existing;
  return `${existing.trim()} | ${addition}`;
}

export function isCashCountLocked(
  count: CashCount,
  businessToday = getBusinessToday()
): boolean {
  return !!count.closedAt || isPastBusinessDate(count.countDate, businessToday);
}

export async function getCashCount(id: string): Promise<CashCount | null> {
  const { data, error } = await getDb()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapCashCount(data as Record<string, unknown>);
}

export async function getCashCounts(organizationId: string): Promise<CashCount[]> {
  const { data, error } = await getDb()
    .from(TABLE)
    .select("*")
    .eq("organization_id", organizationId)
    .order("count_date", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapCashCount);
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
    .maybeSingle();
  if (error || !data) return null;
  return mapCashCount(data as Record<string, unknown>);
}

async function resolveOpeningBalance(
  organizationId: string,
  countDate: string
): Promise<{ cash: number; transfer: number }> {
  const yesterday = getBusinessYesterday(countDate);
  const prev = await getCashCountByDate(organizationId, yesterday);
  const ledger = await getDailyLedgerSummary(organizationId, countDate);
  return {
    cash: prev?.closingCash ?? prev?.actualBalance ?? ledger.cash.opening,
    transfer: prev?.closingTransfer ?? ledger.transfer.opening,
  };
}

async function closeCashCountRecord(
  existing: CashCount,
  auto: boolean
): Promise<CashCount> {
  const expectedBalance = await calculateExpectedBalance(
    existing.organizationId ?? "",
    existing.countDate,
    existing.openingBalance
  );

  let actualBalance = existing.actualBalance;
  let autoClosed = false;
  let note = existing.note;

  if (auto) {
    if (existing.hasManualCount) {
      note = appendNote(note, AUTO_CLOSE_SAVED_NOTE);
    } else {
      actualBalance = expectedBalance;
      autoClosed = true;
      note = appendNote(note, AUTO_CLOSE_NOTE);
    }
  }

  const variance = actualBalance - expectedBalance;
  const status = determineStatus(variance);
  const now = new Date().toISOString();

  const summary = await getDailyLedgerSummary(
    existing.organizationId ?? "",
    existing.countDate
  );
  const ledgerPatch = ledgerPatchFromSummary(summary);

  const patch: Record<string, unknown> = {
    expected_balance: expectedBalance,
    actual_balance: actualBalance,
    variance,
    status,
    note: note ?? null,
    closed_at: now,
    auto_closed: autoClosed,
    closing_type: auto ? "auto" : "manual",
    updated_at: now,
    ...ledgerPatch,
  };

  const { data: updated, error } = await getDb()
    .from(TABLE)
    .update(patch)
    .eq("id", existing.id)
    .select()
    .single();
  if (error) throw error;
  return mapCashCount(updated as Record<string, unknown>);
}

/** ปิดวันเก่าที่ค้าง + เตรียม record วันปัจจุบัน (lazy close) */
export async function ensureDailyCashCountCycle(organizationId: string): Promise<{
  businessToday: string;
  todayRecord: CashCount | null;
  expectedBalance: number;
  openingBalance: number;
}> {
  const businessToday = getBusinessToday();

  const { error: rpcError } = await getDb().rpc("fn_auto_close_cash_counts");
  if (rpcError) {
    const all = await getCashCounts(organizationId);
    for (const row of all) {
      if (row.countDate < businessToday && !row.closedAt) {
        await closeCashCountRecord(row, true);
      }
    }
  }

  let todayRecord = await getCashCountByDate(organizationId, businessToday);

  if (!todayRecord) {
    const { cash: openingBalance, transfer: openingTransfer } = await resolveOpeningBalance(
      organizationId,
      businessToday
    );
    const expectedBalance = await calculateExpectedBalance(
      organizationId,
      businessToday,
      openingBalance
    );

    const { data: inserted, error } = await getDb()
      .from(TABLE)
      .insert({
        organization_id: organizationId,
        count_date: businessToday,
        opening_balance: openingBalance,
        opening_transfer: openingTransfer,
        expected_balance: expectedBalance,
        actual_balance: 0,
        variance: -expectedBalance,
        status: "short",
        has_manual_count: false,
        auto_closed: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error && error.code !== "23505") throw error;
    todayRecord =
      inserted != null
        ? mapCashCount(inserted as Record<string, unknown>)
        : await getCashCountByDate(organizationId, businessToday);
  }

  if (todayRecord && !todayRecord.closedAt) {
    await refreshOpenDailyCloseRecord(organizationId, todayRecord.countDate);
    todayRecord = await getCashCountByDate(organizationId, businessToday);
  }

  return {
    businessToday,
    todayRecord,
    expectedBalance: todayRecord?.expectedBalance ?? 0,
    openingBalance: todayRecord?.openingBalance ?? 0,
  };
}

export async function createCashCount(
  data: Omit<
    CashCount,
    | "id"
    | "expectedBalance"
    | "variance"
    | "status"
    | "createdAt"
    | "closedAt"
    | "autoClosed"
    | "closingType"
    | "hasManualCount"
  >
): Promise<CashCount> {
  const orgId = data.organizationId ?? "";
  const expectedBalance = await calculateExpectedBalance(
    orgId,
    data.countDate,
    data.openingBalance
  );
  const variance = data.actualBalance - expectedBalance;
  const status = determineStatus(variance);
  const now = new Date().toISOString();

  const { data: inserted, error } = await getDb()
    .from(TABLE)
    .insert({
      ...toCashCountInsert(data, { expectedBalance, variance, status }),
      has_manual_count: true,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw error;
  return mapCashCount(inserted as Record<string, unknown>);
}

export async function updateCashCount(
  id: string,
  data: Partial<
    Pick<CashCount, "actualBalance" | "openingBalance" | "countDate" | "note">
  >,
  options?: { isAdmin?: boolean; updatedBy?: string }
): Promise<CashCount> {
  const existing = await getCashCount(id);
  if (!existing) throw new Error("Cash count not found");

  const businessToday = getBusinessToday();
  const locked = isCashCountLocked(existing, businessToday);

  if (locked && !options?.isAdmin) {
    throw new Error("วันนี้ปิดยอดแล้ว — แก้ไขไม่ได้ (ติดต่อ admin)");
  }

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
  const now = new Date().toISOString();

  if (locked && options?.isAdmin) {
    const { data: rows, error } = await getDb().rpc("fn_admin_update_cash_count", {
      p_id: id,
      p_opening_balance: openingBalance,
      p_actual_balance: actualBalance,
      p_note: data.note ?? existing.note ?? null,
      p_updated_by: options.updatedBy ?? null,
    });
    if (error) throw error;
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) throw new Error("Admin update failed");
    return mapCashCount(row as Record<string, unknown>);
  }

  const patch: Record<string, unknown> = {
    expected_balance: expectedBalance,
    variance,
    status,
    has_manual_count: true,
    updated_at: now,
    updated_by: options?.updatedBy ?? null,
  };
  if (data.openingBalance !== undefined) patch.opening_balance = data.openingBalance;
  if (data.actualBalance !== undefined) patch.actual_balance = data.actualBalance;
  if (data.note !== undefined) patch.note = data.note;

  const { data: updated, error } = await getDb()
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapCashCount(updated as Record<string, unknown>);
}

export async function refreshOpenDailyCloseRecord(
  organizationId: string,
  countDate: string
): Promise<void> {
  const row = await getCashCountByDate(organizationId, countDate);
  if (!row || row.closedAt) return;

  const summary = await getDailyLedgerSummary(organizationId, countDate);
  const variance = row.actualBalance - summary.cash.closing;

  await getDb()
    .from(TABLE)
    .update({
      ...ledgerPatchFromSummary(summary),
      variance,
      status: determineStatus(variance),
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);
}

/** @deprecated use refreshOpenDailyCloseRecord */
export async function refreshOpenCashCountExpected(
  organizationId: string,
  countDate: string
): Promise<void> {
  await refreshOpenDailyCloseRecord(organizationId, countDate);
}

export async function isBusinessDateClosed(
  organizationId: string,
  dateStr: string
): Promise<boolean> {
  const row = await getCashCountByDate(organizationId, dateStr);
  if (!row) return isPastBusinessDate(dateStr);
  return isCashCountLocked(row);
}

export async function deleteCashCount(id: string): Promise<void> {
  const { error } = await getDb().from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
