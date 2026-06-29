"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  HistoryAuditCard,
  HistoryCloseCard,
  HistoryCloseRoundCard,
  HistoryPosDayCard,
  type PosDaySummary,
} from "@/components/history/HistoryCards";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { SegmentTabs } from "@/components/ui/SegmentTabs";
import {
  fetchHistoryPageData,
  readHistoryPageCache,
  type HistoryPageApiData,
} from "@/lib/api/client";
import { getAuditLogBusinessDate, getAuditLogSessionRound } from "@/lib/utils/auditLogDate";
import { cn } from "@/lib/utils/cn";
import { formatDateShort } from "@/lib/utils/format";
import { getBusinessToday } from "@/lib/utils/businessDate";
import type { AuditLog, AuditLogAction, CashCount, CashCountCloseEvent } from "@/types";
import { CalendarRange, History, RotateCcw } from "lucide-react";

type SessionRoundFilter = "all" | number;

type HistoryCategory = "income" | "expense" | "pos" | "close";

const CATEGORY_TABS = [
  { id: "income" as const, label: "รายรับ" },
  { id: "expense" as const, label: "รายจ่าย" },
  { id: "pos" as const, label: "ยอดเงินใน POS" },
  { id: "close" as const, label: "ปิดยอด" },
];

function clampDateRange(start: string, end: string): { start: string; end: string } {
  if (!start || !end) return { start, end };
  if (start <= end) return { start, end };
  return { start: end, end: start };
}

function rangeSummary(startDate: string, endDate: string): string {
  if (!startDate && !endDate) return "ทุกช่วงเวลา";
  if (startDate === endDate) return formatDateShort(startDate);
  return `${formatDateShort(startDate)} — ${formatDateShort(endDate)}`;
}

function discoverTransactionRoundsForDate(date: string, logs: AuditLog[]): number[] {
  const rounds = new Set<number>();
  for (const log of logs) {
    if (log.entityType !== "transaction") continue;
    if (getAuditLogBusinessDate(log) !== date) continue;
    rounds.add(getAuditLogSessionRound(log));
  }
  return [...rounds].sort((a, b) => a - b);
}

function auditLogMatchesRound(log: AuditLog, filter: SessionRoundFilter): boolean {
  if (filter === "all") return true;
  return getAuditLogSessionRound(log) === filter;
}

function applyHistoryData(
  data: HistoryPageApiData,
  setters: {
    setAuditLogs: (v: AuditLog[]) => void;
    setCloseRows: (v: CashCount[]) => void;
    setCloseEvents: (v: CashCountCloseEvent[]) => void;
    setPosDays: (v: PosDaySummary[]) => void;
  }
) {
  if (data.tab === "close") {
    setters.setCloseEvents(data.closeEvents);
    setters.setCloseRows(data.closeRows);
    setters.setAuditLogs([]);
    setters.setPosDays([]);
    return;
  }
  if (data.tab === "pos") {
    setters.setPosDays(data.posDays);
    setters.setAuditLogs([]);
    setters.setCloseRows([]);
    setters.setCloseEvents([]);
    return;
  }
  setters.setAuditLogs(data.auditLogs);
  setters.setCloseRows([]);
  setters.setCloseEvents([]);
  setters.setPosDays([]);
}

const EMPTY_MESSAGES: Record<HistoryCategory, { title: string; message: string }> = {
  income: {
    title: "ยังไม่มีประวัติรายรับ",
    message: "รายการบันทึก แก้ไข หรือยกเลิกรายรับจะแสดงในช่วงวันที่ที่เลือก",
  },
  expense: {
    title: "ยังไม่มีประวัติรายจ่าย",
    message: "รายการบันทึก แก้ไข หรือยกเลิกรายจ่ายจะแสดงในช่วงวันที่ที่เลือก",
  },
  pos: {
    title: "ยังไม่มีประวัติเงินสดใน POS",
    message: "ฝาก/ถอน หรือผลนับเงิน (ขาด/เกิน) จะแสดงตามวันที่ที่เลือก",
  },
  close: {
    title: "ยังไม่มีประวัติปิดยอด",
    message: "วันที่มีการปิดยอดหรือนับเงินจะแสดงในช่วงวันที่ที่เลือก",
  },
};

export default function HistoryPage() {
  const today = getBusinessToday();

  const [category, setCategory] = useState<HistoryCategory>("income");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [actionFilter, setActionFilter] = useState<"" | AuditLogAction>("");

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [closeRows, setCloseRows] = useState<CashCount[]>([]);
  const [closeEvents, setCloseEvents] = useState<CashCountCloseEvent[]>([]);
  const [posDays, setPosDays] = useState<PosDaySummary[]>([]);
  const [sessionRoundFilter, setSessionRoundFilter] = useState<SessionRoundFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "income" || tab === "expense" || tab === "pos" || tab === "close") {
      setCategory(tab);
    }
  }, []);

  const dateRange = useMemo(() => clampDateRange(startDate, endDate), [endDate, startDate]);
  const isSingleDay = dateRange.start === dateRange.end && !!dateRange.start;

  const isTransactionCategory = category === "income" || category === "expense";

  useEffect(() => {
    setSessionRoundFilter("all");
  }, [dateRange.start, dateRange.end, category]);

  const setStartDateSafe = (value: string) => {
    setStartDate(value);
    if (value && endDate && value > endDate) setEndDate(value);
  };

  const setEndDateSafe = (value: string) => {
    setEndDate(value);
    if (value && startDate && value < startDate) setStartDate(value);
  };

  const applyToday = () => {
    const bizToday = getBusinessToday();
    setStartDate(bizToday);
    setEndDate(bizToday);
  };

  const applyData = useCallback((data: HistoryPageApiData) => {
    applyHistoryData(data, { setAuditLogs, setCloseRows, setCloseEvents, setPosDays });
  }, []);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      const { start, end } = dateRange;
      const action = actionFilter || undefined;
      const silent = options?.silent && hasLoadedRef.current;

      if (!silent) setLoading(true);
      setError(null);

      try {
        const data = await fetchHistoryPageData({
          tab: category,
          startDate: start,
          endDate: end,
          action,
        });
        applyData(data);
        hasLoadedRef.current = true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "โหลดประวัติไม่สำเร็จ");
        if (!silent && !hasLoadedRef.current) {
          setAuditLogs([]);
          setCloseRows([]);
          setCloseEvents([]);
          setPosDays([]);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [actionFilter, applyData, category, dateRange]
  );

  useEffect(() => {
    const cached = readHistoryPageCache(
      category,
      dateRange.start,
      dateRange.end,
      actionFilter || undefined
    );
    if (cached) {
      applyData(cached);
      hasLoadedRef.current = true;
      setLoading(false);
    }
    void load({ silent: !!cached });
  }, [load, category, dateRange.start, dateRange.end, actionFilter, applyData]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      void load({ silent: true });
    };
    const id = setInterval(tick, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const filteredAuditLogs = useMemo(() => {
    if (!isTransactionCategory || !isSingleDay || sessionRoundFilter === "all") {
      return auditLogs;
    }
    return auditLogs.filter((log) => auditLogMatchesRound(log, sessionRoundFilter));
  }, [auditLogs, isSingleDay, isTransactionCategory, sessionRoundFilter]);

  const sessionRoundOptions = useMemo(() => {
    if (!isSingleDay || !isTransactionCategory) return [];
    return discoverTransactionRoundsForDate(dateRange.start, auditLogs);
  }, [auditLogs, dateRange.start, isSingleDay, isTransactionCategory]);

  const showRoundFilter =
    isTransactionCategory && isSingleDay && sessionRoundOptions.length > 1;

  const countItemsForRound = useCallback(
    (round: SessionRoundFilter) => {
      if (round === "all") return auditLogs.length;
      return auditLogs.filter((log) => auditLogMatchesRound(log, round)).length;
    },
    [auditLogs]
  );

  const itemCount =
    category === "close"
      ? closeEvents.length || closeRows.length
      : category === "pos"
        ? posDays.length
        : filteredAuditLogs.length;
  const rangeLabel = rangeSummary(dateRange.start, dateRange.end);
  const isViewingToday = dateRange.start === today && dateRange.end === today;

  const selectClass =
    "tablet-touch-select w-full rounded-xl border border-border-default bg-surface-elevated px-3 py-2 text-sm font-medium text-text-main transition-colors focus:border-brand focus:outline-none lg:max-w-xs";

  return (
    <AppLayout title="ประวัติรายการ" subtitle="ดูย้อนหลังแยกตามหมวด — รายรับ · รายจ่าย · เงินสดใน POS · ปิดยอด">
      <div className="mx-auto w-full max-w-6xl">
        {error && (
          <p className="mb-4 rounded-xl border border-expense/20 bg-error-light px-4 py-3 text-sm font-bold text-error">
            {error}
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(240px,280px)_1fr] lg:items-start">
          <aside className="rounded-2xl border border-border-default bg-surface-elevated p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] lg:sticky lg:top-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
                <CalendarRange size={18} />
              </span>
              <div>
                <h2 className="text-base font-black text-text-main">ช่วงวันที่</h2>
                <p className="text-xs text-text-muted">เลือกจากปฏิทิน</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-text-secondary">ตั้งแต่</span>
                <Input type="date" value={startDate} onChange={(e) => setStartDateSafe(e.target.value)} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-text-secondary">ถึง</span>
                <Input type="date" value={endDate} onChange={(e) => setEndDateSafe(e.target.value)} />
              </label>
              <button
                type="button"
                onClick={applyToday}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors",
                  isViewingToday
                    ? "border-brand/40 bg-brand/15 text-brand"
                    : "border-border-default bg-surface-inset text-text-main hover:border-brand/30 hover:bg-brand/10 hover:text-brand"
                )}
              >
                <RotateCcw size={16} />
                ดูวันนี้
              </button>
              <p className="text-center text-xs text-text-muted">
                ตั้งทั้งสองช่องเป็น {formatDateShort(today)}
              </p>
            </div>

            <div className="mt-4 rounded-xl bg-surface-inset px-3 py-3 text-sm">
              <p className="font-bold text-text-main">{rangeLabel}</p>
              <p className="mt-1 text-xs text-text-muted">
                {loading ? "กำลังโหลด..." : `${itemCount} รายการ`}
                {showRoundFilter && sessionRoundFilter !== "all" && (
                  <span> · รอบที่ {sessionRoundFilter}</span>
                )}
              </p>
            </div>

            {showRoundFilter ? (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold text-text-secondary">รอบรายรับ/รายจ่าย</p>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSessionRoundFilter("all")}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left text-sm font-bold transition-colors",
                      sessionRoundFilter === "all"
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border-default bg-surface-elevated text-text-secondary hover:border-brand/30"
                    )}
                  >
                    ทุกรอบ
                    <span className="ml-1 font-medium text-text-muted">
                      ({countItemsForRound("all")})
                    </span>
                  </button>
                  {sessionRoundOptions.map((round) => (
                    <button
                      key={round}
                      type="button"
                      onClick={() => setSessionRoundFilter(round)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left text-sm font-bold transition-colors",
                        sessionRoundFilter === round
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-border-default bg-surface-elevated text-text-secondary hover:border-brand/30"
                      )}
                    >
                      รอบที่ {round}
                      <span className="ml-1 font-medium text-text-muted">
                        ({countItemsForRound(round)})
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs leading-relaxed text-text-muted">
                  แยกรายรับ/รายจ่ายตามรอบหลังปิดยอดใหม่ — ไม่ให้รายการปนกัน
                </p>
              </div>
            ) : isTransactionCategory && !isSingleDay ? (
              <p className="mt-4 text-xs text-text-muted">
                เลือกวันเดียว (ตั้งแต่ = ถึง) เพื่อแยกรายรับ/รายจ่ายตามรอบ
              </p>
            ) : category === "pos" || category === "close" ? (
              <p className="mt-4 text-xs text-text-muted">
                แต่ละการ์ดแยกตามรอบอยู่แล้ว — ไม่ต้องเลือกรอบเพิ่ม
              </p>
            ) : null}
          </aside>

          <section className="min-w-0 space-y-4">
            <div className="rounded-2xl border border-border-default bg-surface-elevated p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-inset text-text-muted">
                  <History size={18} />
                </span>
                <div>
                  <h2 className="text-base font-black text-text-main">หมวดประวัติ</h2>
                  <p className="text-xs text-text-muted">เลือกดูตามประเภทรายการ</p>
                </div>
              </div>

              <SegmentTabs
                tabs={CATEGORY_TABS}
                active={category}
                onChange={(id) => setCategory(id as HistoryCategory)}
                className="grid grid-cols-2 gap-1 sm:grid-cols-4"
              />

              {category === "income" || category === "expense" ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-text-muted">
                    {category === "income"
                      ? "ประวัติรายรับ — บันทึก แก้ไข ยกเลิก · เลือกรอบได้เมื่อดูวันเดียว"
                      : "ประวัติรายจ่าย — บันทึก แก้ไข ยกเลิก · เลือกรอบได้เมื่อดูวันเดียว"}
                  </p>
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
              ) : category === "pos" ? (
                <p className="mt-4 text-xs text-text-muted">
                  สรุปเงินสดใน POS รายวัน — แยกการ์ดตามรอบ · ฝาก/ถอน · นับเงิน · ขาด/เกิน
                </p>
              ) : (
                <p className="mt-4 text-xs text-text-muted">
                  ประวัติปิดยอด — แยกการ์ดตามรอบ · กดรายการเพื่อดูรายละเอียดวันนั้น
                </p>
              )}
            </div>

            <div className="space-y-3">
              {loading ? (
                <>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-28 animate-pulse rounded-2xl border border-border-default bg-surface-elevated"
                    />
                  ))}
                </>
              ) : itemCount === 0 ? (
                <div className="rounded-2xl border border-dashed border-border-default bg-surface-elevated py-4">
                  <EmptyState
                    title={EMPTY_MESSAGES[category].title}
                    message={EMPTY_MESSAGES[category].message}
                  />
                </div>
              ) : category === "close" ? (
                closeEvents.length > 0 ? (
                  closeEvents.map((event) => (
                    <HistoryCloseRoundCard
                      key={event.id}
                      event={event}
                    />
                  ))
                ) : (
                  closeRows.map((row) => <HistoryCloseCard key={row.id} row={row} />)
                )
              ) : category === "pos" ? (
                posDays.map((day) => (
                  <HistoryPosDayCard key={`${day.date}-${day.sessionRound}`} day={day} />
                ))
              ) : (
                filteredAuditLogs.map((log) => <HistoryAuditCard key={log.id} log={log} />)
              )}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
