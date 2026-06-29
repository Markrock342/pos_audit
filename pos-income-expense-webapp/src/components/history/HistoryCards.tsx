"use client";

import { useState } from "react";
import Link from "next/link";
import { DateTimeDisplay } from "@/components/ui/DateTimeDisplay";
import { describeAuditChanges } from "@/lib/utils/auditChanges";
import { getAuditLogSessionRound } from "@/lib/utils/auditLogDate";
import {
  CASH_COUNT_PENDING_LABEL,
  CASH_COUNT_STATUS_LABEL,
  cashCountDisplayBadgeClass,
  cashCountStatusBadgeClass,
  getCashCountDisplayLabel,
  getCashCountStatusFromVariance,
  isCashCountPending,
} from "@/lib/utils/cashCountVariance";
import { formatCurrency, formatDateShort, formatWithdrawalAmount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { AuditLog, AuditLogAction, CashCount, CashCountCloseEvent, TransactionType } from "@/types";
import {
  ArrowDownCircle,
  ArrowDownToLine,
  ArrowUpCircle,
  ArrowUpFromLine,
  Ban,
  Banknote,
  ChevronRight,
  FilePlus2,
  Lock,
  PencilLine,
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

function logAmount(log: AuditLog): { text: string; tone: "income" | "expense" } | null {
  const amount = log.newValue?.amount ?? log.oldValue?.amount;
  if (amount == null) return null;
  const num = Number(amount);
  if (Number.isNaN(num)) return null;

  if (log.entityType === "cash_deposit") {
    return { text: `+${formatCurrency(num)}`, tone: "income" };
  }
  if (log.entityType === "cash_withdrawal") {
    return { text: formatWithdrawalAmount(num), tone: "expense" };
  }

  const type: TransactionType = log.transactionType ?? "income";
  const prefix = type === "expense" ? "-" : "+";
  return { text: `${prefix}${formatCurrency(num)}`, tone: type === "expense" ? "expense" : "income" };
}

function TypeBadge({ log }: { log: AuditLog }) {
  if (log.entityType === "cash_deposit") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-income/25 bg-income-light px-2.5 py-0.5 text-xs font-bold text-income">
        <ArrowDownToLine size={13} strokeWidth={2.5} />
        ฝากเงินสด
      </span>
    );
  }
  if (log.entityType === "cash_withdrawal") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-expense/25 bg-expense-light px-2.5 py-0.5 text-xs font-bold text-expense">
        <ArrowUpFromLine size={13} strokeWidth={2.5} />
        ถอนเงินสด
      </span>
    );
  }
  if (!log.transactionType) return null;
  const isIncome = log.transactionType === "income";
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
      {TYPE_LABELS[log.transactionType]}
    </span>
  );
}

function detailLines(log: AuditLog): string[] {
  const lines = describeAuditChanges(log);
  if (log.action === "create" && log.entityType === "transaction") {
    return lines.filter(
      (l) =>
        l !== "บันทึกรายการใหม่" &&
        !l.startsWith("ชื่อหัวใบ:") &&
        !l.startsWith("ยอดรวม:")
    );
  }
  if (log.action === "create" && (log.entityType === "cash_deposit" || log.entityType === "cash_withdrawal")) {
    return lines.slice(1);
  }
  return lines;
}

export function HistoryAuditCard({ log }: { log: AuditLog }) {
  const amount = logAmount(log);
  const action = ACTION_STYLES[log.action];
  const ActionIcon = action.icon;
  const changeLines = detailLines(log);
  const sessionRound = getAuditLogSessionRound(log);
  const title =
    log.entityTitle ??
    (log.entityType === "cash_deposit"
      ? "ฝากเงินสด"
      : log.entityType === "cash_withdrawal"
        ? "ถอนเงินสด"
        : "ไม่มีชื่อรายการ");

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
              <TypeBadge log={log} />
              {sessionRound > 1 && (
                <span className="inline-flex items-center rounded-full bg-surface-inset px-2 py-0.5 text-xs font-bold text-text-muted">
                  รอบ {sessionRound}
                </span>
              )}
            </div>
            <p className="mt-1.5 truncate text-base font-bold text-text-main">{title}</p>
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
              amount.tone === "income" ? "text-income" : "text-expense"
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

export type PosDaySummary = {
  date: string;
  sessionRound: number;
  deposited: number;
  withdrawn: number;
  expectedBalance: number;
  actualBalance: number | null;
  variance: number | null;
  cashCount: CashCount | null;
  movements: AuditLog[];
};

const MOVEMENT_LIST_COLLAPSE_LIMIT = 5;

export function HistoryPosDayCard({ day }: { day: PosDaySummary }) {
  const [movementsExpanded, setMovementsExpanded] = useState(false);
  const counted = day.actualBalance != null;
  const status =
    day.variance != null
      ? getCashCountStatusFromVariance(day.variance)
      : day.cashCount?.status;
  const badgeClass = counted && status
    ? cashCountStatusBadgeClass(status)
    : "bg-surface-inset text-text-muted";
  const statusLabel =
    counted && status ? CASH_COUNT_STATUS_LABEL[status] : CASH_COUNT_PENDING_LABEL;

  const movementCount = day.movements.length;
  const shouldCollapseMovements = movementCount > MOVEMENT_LIST_COLLAPSE_LIMIT;
  const visibleMovements =
    shouldCollapseMovements && !movementsExpanded
      ? day.movements.slice(0, MOVEMENT_LIST_COLLAPSE_LIMIT)
      : day.movements;
  const hiddenMovementCount = movementCount - MOVEMENT_LIST_COLLAPSE_LIMIT;

  return (
    <article className="rounded-2xl border border-border-default bg-surface-elevated p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
            <Banknote size={20} />
          </span>
          <div>
            <Link
              href={`/cash-count/${day.date}`}
              className="text-base font-black text-text-main hover:text-brand"
            >
              {formatDateShort(day.date)}
              {day.sessionRound > 1 && (
                <span className="ml-2 text-sm font-bold text-text-muted">
                  รอบที่ {day.sessionRound}
                </span>
              )}
            </Link>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5 text-income">
                <ArrowDownToLine size={16} />
                ฝาก {formatCurrency(day.deposited)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-expense">
                <ArrowUpFromLine size={16} />
                ถอน {formatWithdrawalAmount(day.withdrawn)}
              </span>
            </div>
          </div>
        </div>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", badgeClass)}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 grid gap-2 rounded-xl bg-surface-inset px-3.5 py-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs text-text-muted">เงินใน POS (คำนวณ)</p>
          <p className="font-bold text-text-main">{formatCurrency(day.expectedBalance)}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">นับได้</p>
          <p className="font-bold text-text-main">
            {counted ? formatCurrency(day.actualBalance!) : "—"}
          </p>
        </div>
      </div>

      {counted && day.variance != null && status && (
        <div
          className={cn(
            "mt-3 flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-sm",
            cashCountStatusBadgeClass(status)
          )}
        >
          <span className="font-bold">{CASH_COUNT_STATUS_LABEL[status]}</span>
          {status !== "balanced" && (
            <span className="font-black tabular-nums">
              {day.variance >= 0 ? "+" : ""}
              {formatCurrency(day.variance)}
            </span>
          )}
        </div>
      )}

      {movementCount > 0 && (
        <ul className="mt-3 space-y-2 border-t border-border-default pt-3">
          {visibleMovements.map((log) => {
            const amount = logAmount(log);
            return (
              <li
                key={log.id}
                className="flex items-center justify-between gap-3 text-sm text-text-secondary"
              >
                <span className="min-w-0 truncate">
                  {log.entityType === "cash_deposit" ? "ฝากเงินสด" : "ถอนเงินสด"}
                  {log.userName ? ` · ${log.userName}` : ""}
                </span>
                {amount && (
                  <span
                    className={cn(
                      "shrink-0 font-bold tabular-nums",
                      amount.tone === "income" ? "text-income" : "text-expense"
                    )}
                  >
                    {amount.text}
                  </span>
                )}
              </li>
            );
          })}
          {shouldCollapseMovements && (
            <li>
              <button
                type="button"
                onClick={() => setMovementsExpanded((open) => !open)}
                className="text-sm font-bold text-brand hover:underline"
              >
                {movementsExpanded
                  ? "ยุบรายการ"
                  : `แสดงอีก ${hiddenMovementCount} รายการ`}
              </button>
            </li>
          )}
        </ul>
      )}

      <Link
        href={`/cash-count/${day.date}`}
        className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline"
      >
        ดูรายละเอียดวันนี้
        <ChevronRight size={16} />
      </Link>
    </article>
  );
}

export function HistoryCloseCard({ row }: { row: CashCount }) {
  const pending = isCashCountPending(row);
  const badgeClass = cashCountDisplayBadgeClass(row);

  return (
    <Link
      href={`/cash-count/${row.countDate}`}
      className="flex items-center justify-between gap-4 rounded-2xl border border-border-default bg-surface-elevated px-4 py-4 transition-colors hover:border-brand hover:bg-brand/5 active:scale-[0.99] sm:px-5"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-text-main">{formatDateShort(row.countDate)}</p>
          {row.closedAt && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-inset px-2 py-0.5 text-xs text-text-muted">
              <Lock size={12} />
              ปิดแล้ว
            </span>
          )}
          {(row.closeEditGeneration ?? 0) > 1 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              มีการแก้ไข
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-text-muted">
          คำนวณ {formatCurrency(row.expectedBalance)}
          {pending ? " · ยังไม่ได้นับ" : ` → นับ ${formatCurrency(row.actualBalance)}`}
        </p>
        {!pending && row.status !== "balanced" && (
          <p className="text-xs text-text-muted">
            ส่วนต่าง: {row.variance >= 0 ? "+" : ""}
            {formatCurrency(row.variance)}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", badgeClass)}>
          {getCashCountDisplayLabel(row)}
        </span>
        <ChevronRight size={18} className="text-text-muted" />
      </div>
    </Link>
  );
}

export function HistoryCloseRoundCard({ event }: { event: CashCountCloseEvent }) {
  const variance = event.variance ?? 0;
  const status =
    variance === 0 ? "balanced" : variance < 0 ? "short" : ("overage" as const);
  const badgeClass = cashCountStatusBadgeClass(status);
  const statusLabel = CASH_COUNT_STATUS_LABEL[status];
  const round = event.sessionRound ?? 1;

  return (
    <Link
      href={`/cash-count/${event.countDate}`}
      className="flex items-center justify-between gap-4 rounded-2xl border border-border-default bg-surface-elevated px-4 py-4 transition-colors hover:border-brand hover:bg-brand/5 active:scale-[0.99] sm:px-5"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-text-main">{formatDateShort(event.countDate)}</p>
          {round > 1 && (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
              รอบที่ {round}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-inset px-2 py-0.5 text-xs text-text-muted">
            <Lock size={12} />
            ปิดแล้ว
          </span>
          {event.eventType === "close_after_edit" && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              ปิดหลังแก้ไข
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-text-muted">
          คำนวณ {formatCurrency(event.expectedBalance ?? 0)}
          {` → นับ ${formatCurrency(event.actualBalance ?? 0)}`}
        </p>
        {status !== "balanced" && (
          <p className="text-xs text-text-muted">
            ส่วนต่าง: {variance >= 0 ? "+" : ""}
            {formatCurrency(variance)}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", badgeClass)}>
          {statusLabel}
        </span>
        <ChevronRight size={18} className="text-text-muted" />
      </div>
    </Link>
  );
}