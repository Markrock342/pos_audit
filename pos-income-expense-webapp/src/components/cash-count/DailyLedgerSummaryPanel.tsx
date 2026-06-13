"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/format";
import type { DailyLedgerSummary } from "@/types";
import { ArrowDownCircle, ArrowUpCircle, Banknote, Lock, PiggyBank } from "lucide-react";

function LedgerLine({
  label,
  value,
  emphasize,
  negative,
}: {
  label: string;
  value: number;
  emphasize?: boolean;
  negative?: boolean;
}) {
  const prefix = negative && value > 0 ? "−" : value < 0 ? "" : "";
  const display = negative && value > 0 ? value : value;
  return (
    <div className={`flex items-center justify-between gap-3 text-sm ${emphasize ? "font-bold text-text-main" : "text-text-secondary"}`}>
      <span>{label}</span>
      <span className={negative && value > 0 ? "text-expense" : emphasize ? "text-brand" : ""}>
        {prefix}
        {formatCurrency(Math.abs(display))}
      </span>
    </div>
  );
}

interface DailyLedgerSummaryPanelProps {
  data: DailyLedgerSummary | null;
  loading?: boolean;
}

export function DailyLedgerSummaryPanel({ data, loading }: DailyLedgerSummaryPanelProps) {
  if (loading) {
    return (
      <Card className="border-t-4 border-t-brand">
        <CardContent className="py-8">
          <p className="text-center text-text-muted">กำลังโหลดสรุป 2 กระเป๋า...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-l-4 border-l-brand">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Banknote size={20} className="text-brand" />
            เงินสดใน POS
          </CardTitle>
          <p className="text-xs text-text-muted">เงินที่ควรมีในเครื่องตามที่บันทึก</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <LedgerLine label="ยอดเปิดวัน" value={data.cash.opening} />
          <LedgerLine label="+ รายรับ (สด)" value={data.cash.income} />
          <LedgerLine label="− รายจ่าย (สด)" value={data.cash.expense} negative />
          <LedgerLine label="− ถอนออกวันนี้" value={data.cash.withdrawn} negative />
          <div className="my-2 border-t border-border-default" />
          <LedgerLine label="คงเหลือ (สด)" value={data.cash.closing} emphasize />
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-income">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PiggyBank size={20} className="text-income" />
            โอน (ตามรายการที่บันทึก)
          </CardTitle>
          <p className="text-xs text-text-muted">ไม่ใช่ยอดจากแอปธนาคาร — สรุปจากสมุด</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <LedgerLine label="ยอดเปิดวัน" value={data.transfer.opening} />
          <LedgerLine label="+ รายรับ (โอน)" value={data.transfer.income} />
          <LedgerLine label="− รายจ่าย (โอน)" value={data.transfer.expense} negative />
          <div className="my-2 border-t border-border-default" />
          <LedgerLine label="คงเหลือ (โอน)" value={data.transfer.closing} emphasize />
        </CardContent>
      </Card>

      <Card className="border-t-4 border-t-text-muted lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">สรุปธุรกิจวันนี้</CardTitle>
            {data.isLocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-inset px-2 py-0.5 text-xs text-text-muted">
                <Lock size={12} />
                {data.closedAt ? "ปิดแล้ว" : "ล็อก"}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted">ไม่รวมการถอนเงิน — นับเฉพาะรายรับ/รายจ่าย</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-income-light/50 p-4">
              <p className="flex items-center gap-1 text-xs text-text-muted">
                <ArrowUpCircle size={14} className="text-income" />
                รายรับรวม
              </p>
              <p className="text-xl font-black text-income">{formatCurrency(data.business.totalIncome)}</p>
            </div>
            <div className="rounded-xl bg-expense-light/50 p-4">
              <p className="flex items-center gap-1 text-xs text-text-muted">
                <ArrowDownCircle size={14} className="text-expense" />
                รายจ่ายรวม
              </p>
              <p className="text-xl font-black text-expense">{formatCurrency(data.business.totalExpense)}</p>
            </div>
            <div className="rounded-xl bg-surface-inset p-4">
              <p className="text-xs text-text-muted">สุทธิวันนี้</p>
              <p className={`text-xl font-black ${data.business.netTotal >= 0 ? "text-income" : "text-expense"}`}>
                {data.business.netTotal >= 0 ? "+" : ""}
                {formatCurrency(data.business.netTotal)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
