"use client";

import { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DateTimeDisplay } from "@/components/ui/DateTimeDisplay";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { fetchAuditLogs } from "@/lib/api/client";
import { describeAuditChanges } from "@/lib/utils/auditChanges";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import type { AuditLog, AuditLogAction, TransactionType } from "@/types";
import { ArrowDownCircle, ArrowUpCircle, History } from "lucide-react";

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

function getPresetRange(preset: DatePreset): {
  startDate?: string;
  endDate?: string;
} {
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
      return "แสดงประวัติวันนี้";
    case "week":
      return "แสดงประวัติ 7 วันล่าสุด";
    case "month":
      return startDate && endDate
        ? `แสดงประวัติ ${formatDateShort(startDate)} — ${formatDateShort(endDate)}`
        : "แสดงประวัติเดือนนี้";
    case "all":
      return "แสดงประวัติทั้งหมด";
  }
}

function actionClass(action: AuditLogAction): string {
  if (action === "void") return "font-medium text-error";
  if (action === "create") return "font-medium text-income";
  return "font-medium text-brand";
}

function TransactionTypeBadge({ type }: { type?: TransactionType }) {
  if (!type) return <span className="text-text-muted">—</span>;

  const isIncome = type === "income";
  return (
    <span
      className={
        isIncome
          ? "inline-flex items-center gap-1.5 rounded-full border border-income/30 bg-income-light px-3 py-1 text-sm font-bold text-income"
          : "inline-flex items-center gap-1.5 rounded-full border border-expense/30 bg-expense-light px-3 py-1 text-sm font-bold text-expense"
      }
    >
      {isIncome ? <ArrowUpCircle size={16} strokeWidth={2.5} /> : <ArrowDownCircle size={16} strokeWidth={2.5} />}
      {TYPE_LABELS[type]}
    </span>
  );
}

function amountClass(type?: TransactionType): string {
  if (type === "income") return "font-semibold text-income";
  if (type === "expense") return "font-semibold text-expense";
  return "font-semibold";
}

function logAmount(log: AuditLog): string | null {
  const amount = log.newValue?.amount ?? log.oldValue?.amount;
  if (amount == null) return null;
  const num = Number(amount);
  if (Number.isNaN(num)) return null;
  const prefix = log.transactionType === "expense" ? "-" : "+";
  return `${prefix}${formatCurrency(num)}`;
}

function AuditChangeDetails({ log }: { log: AuditLog }) {
  const lines = describeAuditChanges(log);
  return (
    <ul className="max-w-xs space-y-1 text-xs text-text-secondary">
      {lines.map((line, index) => (
        <li key={`${index}-${line}`} className="leading-snug">
          {line}
        </li>
      ))}
    </ul>
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

  return (
    <AppLayout title="ประวัติการทำรายการ">
      <div className="space-y-6">
        {error && (
          <p className="rounded-xl bg-error-light px-4 py-3 text-sm font-bold text-error">
            {error}
          </p>
        )}

        <Card>
          <CardHeader className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <History size={22} />
                ประวัติการเคลื่อนไหวทั้งหมด
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <select
                  className="rounded-xl border-2 border-border-default bg-surface-elevated px-3 py-2 text-sm"
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value as "" | "income" | "expense")
                  }
                >
                  <option value="">ทุกประเภทรายการ</option>
                  <option value="income">รายรับ</option>
                  <option value="expense">รายจ่าย</option>
                </select>
                <select
                  className="rounded-xl border-2 border-border-default bg-surface-elevated px-3 py-2 text-sm"
                  value={actionFilter}
                  onChange={(e) =>
                    setActionFilter(e.target.value as "" | AuditLogAction)
                  }
                >
                  <option value="">ทุกการกระทำ</option>
                  <option value="create">บันทึกใหม่</option>
                  <option value="update">แก้ไข</option>
                  <option value="void">ยกเลิก</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border-default pt-4">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(PRESET_LABELS) as DatePreset[]).map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    size="sm"
                    variant={datePreset === preset ? "primary" : "outline"}
                    className="!min-h-10 !h-10 px-4 text-sm"
                    onClick={() => setDatePreset(preset)}
                  >
                    {PRESET_LABELS[preset]}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-text-muted">
                {presetSummary(datePreset)}
                {!loading && ` · ${logs.length} รายการ`}
                {loading && " · กำลังโหลด..."}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-text-muted">กำลังโหลด...</p>
            ) : logs.length === 0 ? (
              <EmptyState
                title="ไม่มีประวัติในช่วงที่เลือก"
                message="ลองเปลี่ยนช่วงวันที่หรือตัวกรองอื่น"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-default text-text-muted">
                      <th className="px-3 py-2 font-medium">วันเวลา</th>
                      <th className="px-3 py-2 font-medium">ผู้ทำ</th>
                      <th className="px-3 py-2 font-medium">ประเภท</th>
                      <th className="px-3 py-2 font-medium">การกระทำ</th>
                      <th className="px-3 py-2 font-medium">รายการ</th>
                      <th className="px-3 py-2 font-medium">รายละเอียดการเปลี่ยนแปลง</th>
                      <th className="px-3 py-2 font-medium text-right">จำนวนเงิน</th>
                      <th className="px-3 py-2 font-medium">เหตุผล</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const amount = logAmount(log);
                      return (
                        <tr
                          key={log.id}
                          className="border-b border-border-default/60 align-top hover:bg-surface-hover/50"
                        >
                          <td className="px-3 py-3">
                            <DateTimeDisplay iso={log.createdAt} />
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap font-medium">
                            {log.userName ?? "—"}
                          </td>
                          <td className="px-3 py-3">
                            <TransactionTypeBadge type={log.transactionType} />
                          </td>
                          <td className="px-3 py-3">
                            <span className={actionClass(log.action)}>
                              {ACTION_LABELS[log.action]}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-medium">
                            {log.entityTitle ?? "-"}
                          </td>
                          <td className="px-3 py-3">
                            <AuditChangeDetails log={log} />
                          </td>
                          <td className={`px-3 py-3 text-right whitespace-nowrap ${amountClass(log.transactionType)}`}>
                            {amount ?? "-"}
                          </td>
                          <td className="px-3 py-3 text-text-secondary">
                            {log.action === "create" ? "—" : log.reason}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
