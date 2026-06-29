import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import {
  closeEditAuditActionLabel,
  closeEditAuditAmount,
  closeEditAuditKind,
  closeEditAuditTitle,
  partitionCloseEditAudits,
} from "@/lib/utils/closeEditAuditDisplay";
import { cn } from "@/lib/utils/cn";
import type { AuditLog, CashCountCloseEvent } from "@/types";
import type { CloseEditRound } from "@/lib/utils/closeEditRounds";
import {
  ArrowUpCircle,
  ArrowUpFromLine,
  Lock,
  Pencil,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";

function CloseEditAuditCompactRow({ log }: { log: AuditLog }) {
  const amount = closeEditAuditAmount(log);
  const isIncome =
    log.entityType === "cash_deposit" || log.transactionType === "income";
  const amountClass = isIncome ? "text-income" : "text-expense";

  return (
    <li className="flex items-center gap-2 rounded-xl border border-border-default bg-surface-elevated px-2.5 py-2 sm:px-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1">
          <span className="rounded bg-surface-inset px-1.5 py-0.5 text-[10px] font-bold text-text-muted">
            {closeEditAuditActionLabel(log)}
          </span>
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 text-[10px] font-bold",
              isIncome
                ? "border-income/25 bg-income-light/80 text-income"
                : "border-expense/25 bg-expense-light/80 text-expense"
            )}
          >
            {closeEditAuditKind(log)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm font-bold text-text-main">
          {closeEditAuditTitle(log)}
        </p>
        <p className="truncate text-[10px] text-text-muted sm:text-xs">
          {formatDateTime(log.createdAt)}
          {log.userName ? ` · ${log.userName}` : ""}
        </p>
      </div>
      {amount && (
        <p className={cn("shrink-0 text-sm font-black tabular-nums sm:text-base", amountClass)}>
          {amount}
        </p>
      )}
    </li>
  );
}

function CloseEditListPanel({
  title,
  count,
  hint,
  icon: Icon,
  audits,
  emptyText,
  accent,
}: {
  title: string;
  count: number;
  hint: string;
  icon: LucideIcon;
  audits: AuditLog[];
  emptyText: string;
  accent: "income" | "expense" | "neutral";
}) {
  const accentBorder =
    accent === "income"
      ? "border-income/30"
      : accent === "expense"
        ? "border-expense/30"
        : "border-border-default";

  return (
    <section
      className={cn(
        "flex min-h-0 flex-1 flex-col rounded-2xl border-2 bg-surface-elevated/60",
        accentBorder
      )}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-border-default px-3 py-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-inset text-text-muted">
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-text-main">{title}</p>
          <p className="text-[10px] text-text-muted sm:text-xs">
            {count} รายการ · {hint}
          </p>
        </div>
      </header>
      <div className="pos-movement-list-scroll min-h-0 flex-1 p-2">
        {audits.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-text-muted">{emptyText}</p>
        ) : (
          <ol className="space-y-1.5">
            {audits.map((log) => (
              <CloseEditAuditCompactRow key={log.id} log={log} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function CloseEditEventCompact({
  event,
  label,
  icon: Icon,
}: {
  event: CashCountCloseEvent;
  label: string;
  icon: typeof Lock;
}) {
  return (
    <div className="rounded-xl border border-border-default bg-surface-inset/50 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Icon size={14} className="shrink-0 text-text-muted" />
        <p className="text-[10px] font-bold uppercase text-text-muted">{label}</p>
      </div>
      <p className="mt-1 text-xs font-bold text-text-main">{formatDateTime(event.createdAt)}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-text-secondary">
        {event.expectedBalance != null && <>คำนวณ {formatCurrency(event.expectedBalance)}</>}
        {event.actualBalance != null && <> · นับ {formatCurrency(event.actualBalance)}</>}
        {event.clearDrawerAmount != null && event.clearDrawerAmount > 0 && (
          <> · เคลียร์ {formatCurrency(event.clearDrawerAmount)}</>
        )}
      </p>
    </div>
  );
}

/** Layout เต็มหน้า: ซ้ายรายรับจ่าย · ขวาบนฝากถอน · ขวาล่างสรุปรอบ */
export function CloseEditRoundDashboard({ round }: { round: CloseEditRound }) {
  const { cashMovement, business } = partitionCloseEditAudits(round.editAudits);

  return (
    <div className="grid min-h-0 flex-1 gap-3 lg:min-h-[min(32rem,calc(100dvh-11rem))] lg:grid-cols-5 lg:gap-4">
      <div className="flex min-h-0 min-h-[12rem] flex-col lg:col-span-3 lg:min-h-0">
        <CloseEditListPanel
          title="รายรับ / รายจ่าย"
          count={business.length}
          hint="เพิ่ม · แก้ไข · ยกเลิก"
          icon={ArrowUpCircle}
          audits={business}
          emptyText="ไม่มีรายรับหรือรายจ่ายในรอบนี้"
          accent="income"
        />
      </div>

      <div className="flex min-h-0 flex-col gap-3 lg:col-span-2 lg:min-h-0">
        <div className="flex min-h-[8rem] min-h-0 flex-1 flex-col lg:min-h-0">
          <CloseEditListPanel
            title="ฝาก / ถอนเงินสด"
            count={cashMovement.length}
            hint="ไม่นับเป็นรายรับรายจ่าย"
            icon={ArrowUpFromLine}
            audits={cashMovement}
            emptyText="ไม่มีฝากหรือถอนในรอบนี้"
            accent="neutral"
          />
        </div>

        <section className="shrink-0 rounded-2xl border-2 border-border-default bg-surface-elevated/60 p-3">
          <p className="mb-2 text-xs font-black text-text-muted">สรุปรอบ</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <CloseEditEventCompact
              event={round.reopenEvent}
              label="เปิดแก้ไข"
              icon={Pencil}
            />
            {round.closeAfterEvent ? (
              <CloseEditEventCompact
                event={round.closeAfterEvent}
                label="ปิดยอดใหม่"
                icon={RefreshCw}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-amber-400/50 bg-amber-500/5 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-amber-600 dark:text-amber-400" />
                  <p className="text-[10px] font-bold text-amber-800 dark:text-amber-200">
                    ยังไม่ปิดยอดใหม่
                  </p>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-text-muted">
                  แก้ไขเสร็จแล้วกด «ปิดยอดใหม่» ที่หน้าปิดยอดวันนี้
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export function CloseEditEventSummary({
  event,
  label,
}: {
  event: CashCountCloseEvent;
  label: string;
}) {
  return (
    <CloseEditEventCompact event={event} label={label} icon={Lock} />
  );
}

export function CloseEditRoundSummaryLine({ round }: { round: CloseEditRound }) {
  const { cashMovement, business } = partitionCloseEditAudits(round.editAudits);
  const parts: string[] = [];

  if (round.inProgress) {
    parts.push("กำลังแก้ไข");
  } else if (round.closeAfterEvent) {
    parts.push("ปิดยอดใหม่แล้ว");
  }

  const detail: string[] = [];
  if (cashMovement.length > 0) detail.push(`ฝาก/ถอน ${cashMovement.length}`);
  if (business.length > 0) detail.push(`รายรับจ่าย ${business.length}`);
  if (detail.length > 0) {
    parts.push(detail.join(" · "));
  } else {
    parts.push(`${round.editCount} รายการ`);
  }

  parts.push(formatDateTime(round.reopenEvent.createdAt));
  return parts.join(" · ");
}
