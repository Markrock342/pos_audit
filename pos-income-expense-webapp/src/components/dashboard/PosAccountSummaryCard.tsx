import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  activeCashClosing,
  isTodayBusinessClosed,
} from "@/lib/utils/activeDayDisplay";
import { formatCurrency } from "@/lib/utils/format";
import type { DailyCloseStatus, DailyLedgerSummary } from "@/types";
import { Calculator } from "lucide-react";

interface PosAccountSummaryCardProps {
  ledger: DailyLedgerSummary | null;
  status: DailyCloseStatus;
}

function Line({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className={negative && value > 0 ? "font-semibold text-expense" : "font-semibold text-text-main"}>
        {negative && value > 0 ? "−" : ""}
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}

export function PosAccountSummaryCard({ ledger, status }: PosAccountSummaryCardProps) {
  const dayClosed = isTodayBusinessClosed(status);
  const cash = ledger?.cash;
  const posDisplay = activeCashClosing(status.cashClosing, status);

  return (
    <Link href="/cash-count" className="block active:scale-[0.98] transition-transform">
      <Card className="border-t-4 border-t-brand">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator size={18} className="text-brand" />
            บัญชีรวมวันนี้ (เงินสด)
          </CardTitle>
          <p className="text-xs font-normal text-text-muted">
            ฝาก + รายรับ(สด) − รายจ่าย(สด) − ถอน = เงินใน POS
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {dayClosed ? (
            <p className="text-sm font-bold text-text-muted">
              ปิดวันแล้ว — ยอดเคลียร์เป็น 0 · ดูสรุปจริงที่ ปิดยอด → ประวัติ
            </p>
          ) : cash ? (
            <>
              {(cash.deposited ?? 0) > 0 && (
                <Line label="ฝากเงินสด (เช้า)" value={cash.deposited} />
              )}
              <Line label="+ รายรับ (สด)" value={cash.income} />
              <Line label="− รายจ่าย (สด)" value={cash.expense} negative />
              {cash.withdrawn > 0 && (
                <Line label="− ถอนออกวันนี้" value={cash.withdrawn} negative />
              )}
              <div className="my-2 border-t border-border-default" />
              <Line label="= เงินใน POS" value={posDisplay} />
            </>
          ) : (
            <p className="text-sm text-text-muted">กำลังโหลด...</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
