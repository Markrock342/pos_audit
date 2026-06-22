import { getDb } from "@/lib/db/supabase";
import { mapCashCount, toCashCountInsert } from "@/lib/utils/dbMap";
import {
  getBusinessToday,
  getBusinessYesterday,
  isPastBusinessDate,
} from "@/lib/utils/businessDate";
import { getTransactions } from "./transactions";
import { getTotalWithdrawnForDate, createCashWithdrawal } from "./cashWithdrawals";
import { getTotalDepositedForDate } from "./cashDeposits";
import { getOrganization } from "./organizations";
import { getDailyLedgerSummary, ledgerPatchFromSummary, summaryFromStoredLedgerFields } from "./dailyLedger";
import { isFullDailyReset } from "@/lib/utils/dailyResetMode";
import type { CashCount, CashCountStatus, CashWithdrawal, DailyLedgerSummary } from "@/types";

const TABLE = "cash_counts";

const AUTO_CLOSE_NOTE =
  "ปิดอัตโนมัติ — ไม่ได้นับเงินจริง (ใช้ยอดคาดหวัง)";
const AUTO_CLOSE_SAVED_NOTE = "ปิดอัตโนมัติ — ใช้ยอดที่บันทึกไว้";

export async function calculateExpectedBalance(
  organizationId: string,
  countDate: string,
  openingBalance: number
): Promise<number> {
  const transactions = await getTransactions(
    organizationId,
    {
      status: "active",
      startDate: countDate,
      endDate: countDate,
    },
    { includeLineItems: false }
  );

  const income = transactions
    .filter((t) => t.type === "income" && t.paymentMethod === "cash")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === "expense" && t.paymentMethod === "cash")
    .reduce((sum, t) => sum + t.amount, 0);

  const withdrawn = await getTotalWithdrawnForDate(organizationId, countDate);
  const deposited = await getTotalDepositedForDate(organizationId, countDate);

  return openingBalance + income - expense - withdrawn + deposited;
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

export async function getCashCounts(
  organizationId: string,
  options?: { limit?: number }
): Promise<CashCount[]> {
  let q = getDb()
    .from(TABLE)
    .select("*")
    .eq("organization_id", organizationId)
    .order("count_date", { ascending: false });
  if (options?.limit) q = q.limit(options.limit);
  const { data, error } = await q;
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
  const org = await getOrganization(organizationId);
  if (isFullDailyReset(org?.financeConfig)) {
    return { cash: 0, transfer: 0 };
  }

  const yesterday = getBusinessYesterday(countDate);
  const prev = await getCashCountByDate(organizationId, yesterday);
  const ledger = await getDailyLedgerSummary(organizationId, countDate);
  return {
    cash: prev?.closingCash ?? prev?.actualBalance ?? ledger.cash.opening,
    transfer: prev?.closingTransfer ?? ledger.transfer.opening,
  };
}

export const CLEAR_DRAWER_NOTE = "เคลียร์ลิ้นชักประจำวัน";

/** เย็น — นับเงิน → ถอนออกหมดตามยอดคงเหลือ → ปิดวัน (variance คำนวณก่อนเคลียร์) */
export async function clearDrawerAndCloseDay(
  organizationId: string,
  options?: {
    actualBalance?: number;
    note?: string;
    recordedBy?: string;
    updatedBy?: string;
  }
): Promise<{
  cashCount: CashCount;
  withdrawal: CashWithdrawal | null;
  ledger: DailyLedgerSummary;
}> {
  const businessToday = getBusinessToday();
  await ensureDailyCashCountCycle(organizationId, { syncLedger: true });

  const record = await getCashCountByDate(organizationId, businessToday);
  if (!record) throw new Error("ไม่พบข้อมูลวันนี้ — ลอง refresh หน้าใหม่");
  if (record.closedAt) throw new Error("วันนี้ปิดยอดแล้ว — ไม่สามารถเคลียร์ซ้ำได้");

  const ledgerBefore = await getDailyLedgerSummary(organizationId, businessToday, {
    forceRecalc: true,
  });
  const expectedAtCount = ledgerBefore.cash.closing;

  const actualAtCount =
    options?.actualBalance ??
    (record.hasManualCount ? record.actualBalance : expectedAtCount);

  if (Number.isNaN(actualAtCount) || actualAtCount < 0) {
    throw new Error("กรุณากรอกยอดเงินที่นับได้ก่อนเคลียร์ลิ้นชัก");
  }

  const variance = actualAtCount - expectedAtCount;
  const status = determineStatus(variance);
  const now = new Date().toISOString();

  let withdrawal: CashWithdrawal | null = null;
  if (expectedAtCount > 0) {
    withdrawal = await createCashWithdrawal({
      organizationId,
      withdrawalDate: businessToday,
      amount: expectedAtCount,
      note: CLEAR_DRAWER_NOTE,
      recordedBy: options?.recordedBy,
    });
  }

  const ledgerAfter = await getDailyLedgerSummary(organizationId, businessToday, {
    forceRecalc: true,
  });

  const note = options?.note?.trim()
    ? appendNote(record.note, options.note.trim())
    : record.note;

  const patch: Record<string, unknown> = {
    ...ledgerPatchFromSummary(ledgerAfter),
    actual_balance: actualAtCount,
    expected_balance: expectedAtCount,
    variance,
    status,
    has_manual_count: true,
    closed_at: now,
    closing_type: "manual",
    auto_closed: false,
    note: note ?? null,
    updated_at: now,
    updated_by: options?.updatedBy ?? null,
  };

  const { data: updated, error } = await getDb()
    .from(TABLE)
    .update(patch)
    .eq("id", record.id)
    .select()
    .single();
  if (error) throw error;

  return {
    cashCount: mapCashCount(updated as Record<string, unknown>),
    withdrawal,
    ledger: ledgerAfter,
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
export async function ensureDailyCashCountCycle(
  organizationId: string,
  options?: { syncLedger?: boolean }
): Promise<{
  businessToday: string;
  todayRecord: CashCount | null;
  expectedBalance: number;
  openingBalance: number;
  ledger: DailyLedgerSummary | null;
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

  let ledger: DailyLedgerSummary | null = null;

  if (todayRecord) {
    ledger = summaryFromStoredLedgerFields(
      todayRecord,
      todayRecord.countDate,
      businessToday
    );

    const needsSync = options?.syncLedger === true || !ledger;

    if (needsSync && !todayRecord.closedAt) {
      ledger = await getDailyLedgerSummary(organizationId, todayRecord.countDate, {
        forceRecalc: options?.syncLedger === true || !ledger,
      });
      await refreshOpenDailyCloseRecord(organizationId, todayRecord.countDate, ledger);
      todayRecord = await getCashCountByDate(organizationId, businessToday);
    } else if (needsSync && todayRecord.closedAt) {
      ledger =
        ledger ??
        (await getDailyLedgerSummary(organizationId, todayRecord.countDate));
    }
  }

  return {
    businessToday,
    todayRecord,
    expectedBalance: todayRecord?.expectedBalance ?? ledger?.cash.closing ?? 0,
    openingBalance: todayRecord?.openingBalance ?? ledger?.cash.opening ?? 0,
    ledger,
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
  countDate: string,
  summary?: DailyLedgerSummary
): Promise<void> {
  const row = await getCashCountByDate(organizationId, countDate);
  if (!row || row.closedAt) return;

  const ledger =
    summary ??
    (await getDailyLedgerSummary(organizationId, countDate, { forceRecalc: true }));
  const variance = row.actualBalance - ledger.cash.closing;

  await getDb()
    .from(TABLE)
    .update({
      ...ledgerPatchFromSummary(ledger),
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
