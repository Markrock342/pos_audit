"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DateTimeDisplay } from "@/components/ui/DateTimeDisplay";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchAuditLogs } from "@/lib/api/client";
import { describeAuditChanges } from "@/lib/utils/auditChanges";
import { formatCurrency, formatDateShort, formatWithdrawalAmount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { AuditLog, AuditLogAction, TransactionType } from "@/types";
import {
  ArrowDownCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpCircle,
  FilePlus2,
  History,
  PencilLine,
  Ban,
  User,
} from "lucide-react";

const ACTION_LABELS: Record<AuditLogAction, string> = {
  create: "บันทึกใหม่",
  update: "แก้ไข",
  void: "ยกเลิก",
};

const TYPE_LABELS = {
  income: "รายรับ",
  expense: "รายจ่าย",
} as const;

type DatePreset = "today" | "week" | "month" | "all";

const PRESET_LABELS: Record<DatePreset, string> = {
  today: "วันนี้",
  week: "7 วัน",
  month: "เดือนนี้",
  all: "ทั้งหมด",
};

/** สี/ไอคอนของแต่ละการกระทำ — ใช้โทนอ่อนเป็น accent ไม่ฉูดฉาด */
const ACTION_STYLES: Record<
  AuditLogAction,
  { label: string; chip: string; icon: typeof FilePlus2 }
> = {
  create: {
    label: ACTION_LABELS.create,
    chip: "border-income/25 bg-income-light text-income",
    icon: FilePlus2,
  },
  update: {
    label: ACTION_LABELS.update,
    chip: "border-brand/25 bg-brand-light text-brand",
    icon: PencilLine,
  },
  void: {
    label: ACTION_LABELS.void,
    chip: "border-expense/25 bg-expense-light text-expense",
    icon: Ban,
  },
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getFirstDayOfMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function getDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

function getPresetRange(preset: DatePreset): { startDate?: string; endDate?: string } {
  switch (preset) {
    case "today": {
      const today = getToday();
      return { startDate: today, endDate: today };
    }
    case "week":
      return { startDate: getDaysAgo(7), endDate: getToday() };
    case "month":
      return { startDate: getFirstDayOfMonth(), endDate: getToday() };
    case "all":
      return {};
  }
}

function presetSummary(preset: DatePreset): string {
  const { startDate, endDate } = getPresetRange(preset);
  switch (preset) {
    case "today":
      return "ประวัติวันนี้";
    case "week":
      return "ประวัติ 7 วันล่าสุด";
    case "month":
      return startDate && endDate
        ? `${formatDateShort(startDate)} — ${formatDateShort(endDate)}`
        : "ประวัติเดือนนี้";
    case "all":
      return "ประวัติทั้งหมด";
  }
}

function logAmount(log: AuditLog): { text: string; type: TransactionType | "deposit" | "withdraw" } | null {
  if (log.entityType === "cash_deposit") {
    const amount = log.newValue?.amount;
    if (amount == null) return null;
    const num = Number(amount);
    if (Number.isNaN(num)) return null;
    return { text: `+${formatCurrency(num)}`, type: "deposit" };
  }
  if (log.entityType === "cash_withdrawal") {
    const amount = log.newValue?.amount;
    if (amount == null) return null;
    const num = Number(amount);
    if (Number.isNaN(num)) return null;
    return { text: formatWithdrawalAmount(num), type: "withdraw" };
  }
  const amount = log.newValue?.amount ?? log.oldValue?.amount;
  if (amount == null) return null;
  const num = Number(amount);
  if (Number.isNaN(num)) return null;
  const type: TransactionType = log.transactionType ?? "income";
  const prefix = type === "expense" ? "-" : "+";
  return { text: `${prefix}${formatCurrency(num)}`, type };
}

function TypeBadge({ type }: { type?: TransactionType }) {
  if (!type) return null;
  const isIncome = type === "income";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold",
        isIncome
          ? "border-income/25 bg-income-light text-income"
          : "border-expense/25 bg-expense-light text-expense"
      )}
    >
      {isIncome ? <ArrowUpCircle size={13} strokeWidth={2.5} /> : <ArrowDownCircle size={13} strokeWidth={2.5} />}
      {TYPE_LABELS[type]}
    </span>
  );
}

/** ตัดบรรทัดที่ซ้ำกับส่วนหัวการ์ด (ชื่อ/ยอด/หัวข้อ) ออก เหลือรายละเอียดที่มีประโยชน์ */
function detailLines(log: AuditLog): string[] {
  const lines = describeAuditChanges(log);
  if (log.entityType === "cash_deposit" || log.entityType === "cash_withdrawal") {
    return lines.filter((l) => !l.startsWith("จำนวน:"));
  }
  if (log.action === "create") {
    return lines.filter(
      (l) =>
        l !== "บันทึกรายการใหม่" &&
        !l.startsWith("ชื่อหัวใบ:") &&
        !l.startsWith("ยอดรวม:")
    );
  }
  return lines;
}

function HistoryCard({ log }: { log: AuditLog }) {
  const amount = logAmount(log);
  const isDeposit = log.entityType === "cash_deposit";
  const isWithdraw = log.entityType === "cash_withdrawal";
  const isCashMovement = isDeposit || isWithdraw;
  const action = isDeposit
    ? {
        label: "ฝากเงินสด",
        chip: "border-brand/25 bg-brand-light text-brand",
        icon: ArrowDownToLine,
      }
    : isWithdraw
      ? {
          label: "ถอนเงินสด",
          chip: "border-expense/25 bg-expense-light text-expense",
          icon: ArrowUpFromLine,
        }
      : ACTION_STYLES[log.action];
  const ActionIcon = action.icon;
  const changeLines = detailLines(log);

  return (
    <article className="rounded-2xl border border-border-default bg-surface-elevated p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
              action.chip
            )}
          >
            <ActionIcon size={20} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold",
                  action.chip
                )}
              >
                {action.label}
              </span>
              {!isCashMovement && <TypeBadge type={log.transactionType} />}
            </div>
            <p className="mt-1.5 truncate text-base font-bold text-text-main">
              {log.entityTitle ?? "ไม่มีชื่อรายการ"}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-muted">
              <DateTimeDisplay iso={log.createdAt} showRelative={false} className="inline!" />
              {log.userName && (
                <span className="inline-flex items-center gap-1">
                  <User size={12} />
                  {log.userName}
                </span>
              )}
            </p>
          </div>
        </div>

        {amount && (
          <p
            className={cn(
              "shrink-0 text-lg font-black tabular-nums",
              amount.type === "deposit" || amount.type === "income"
                ? "text-income"
                : amount.type === "withdraw" || amount.type === "expense"
                  ? "text-expense"
                  : "text-text-main"
            )}
          >
            {amount.text}
          </p>
        )}
      </div>

      {changeLines.length > 0 && (
        <ul className="mt-3 space-y-0.5 rounded-xl bg-surface-inset px-3.5 py-2.5 text-sm leading-relaxed text-text-secondary">
          {changeLines.map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ul>
      )}

      {log.action !== "create" && log.reason && (
        <p className="mt-2 text-sm text-text-secondary">
          <span className="font-semibold text-text-main">เหตุผล:</span> {log.reason}
        </p>
      )}
    </article>
  );
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<"" | AuditLogAction>("");
  const [typeFilter, setTypeFilter] = useState<"" | "income" | "expense">("");
  const [datePreset, setDatePreset] = useState<DatePreset>("month");

  const load = useCallback(async () => {
    setError(null);
    const { startDate, endDate } = getPresetRange(datePreset);
    try {
      const data = await fetchAuditLogs({
        action: actionFilter || undefined,
        transactionType: typeFilter || undefined,
        startDate,
        endDate,
      });
      setLogs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดประวัติไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, typeFilter, datePreset]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const selectClass =
    "tablet-touch-select min-w-0 flex-1 rounded-xl border border-border-default bg-surface-elevated px-3 py-2 text-sm font-medium text-text-main transition-colors focus:border-brand focus:outline-none sm:flex-none";

  const summary = useMemo(() => presetSummary(datePreset), [datePreset]);

  return (
    <AppLayout title="ประวัติรายการ">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 pb-6">
        {error && (
          <p className="rounded-xl border border-expense/20 bg-error-light px-4 py-3 text-sm font-bold text-error">
            {error}
          </p>
        )}

        {/* ── แถบกรอง ── */}
        <div className="sticky top-0 z-10 -mx-1 rounded-2xl border border-border-default bg-surface-elevated/95 px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] backdrop-blur sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
              <History size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-black text-text-main">ประวัติการเคลื่อนไหว</h2>
              <p className="text-xs text-text-muted">
                {summary}
                {!loading && ` · ${logs.length} รายการ`}
                {loading && " · กำลังโหลด..."}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(PRESET_LABELS) as DatePreset[]).map((preset) => {
              const active = datePreset === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDatePreset(preset)}
                  className={cn(
                    "tablet-touch-chip rounded-full px-4 py-1.5 text-sm font-bold transition-colors",
                    active
                      ? "bg-brand text-text-inverse shadow-[0_2px_8px_rgba(255,107,53,0.3)]"
                      : "border border-border-default bg-surface text-text-secondary active:bg-surface-hover"
                  )}
                >
                  {PRESET_LABELS[preset]}
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
            <select
              className={selectClass}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "" | "income" | "expense")}
            >
              <option value="">ทุกประเภทรายการ</option>
              <option value="income">รายรับ</option>
              <option value="expense">รายจ่าย</option>
            </select>
            <select
              className={selectClass}
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as "" | AuditLogAction)}
            >
              <option value="">ทุกการกระทำ</option>
              <option value="create">บันทึกใหม่</option>
              <option value="update">แก้ไข</option>
              <option value="void">ยกเลิก</option>
            </select>
          </div>
        </div>

        {/* ── รายการ ── */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-border-default bg-surface-elevated"
              />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-default bg-surface-elevated py-4">
            <EmptyState
              title="ยังไม่มีประวัติรายการ"
              message="เมื่อมีการบันทึก แก้ไข หรือยกเลิกรายการ จะแสดงที่นี่ — ลองเปลี่ยนช่วงวันที่หรือตัวกรอง"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <HistoryCard key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
