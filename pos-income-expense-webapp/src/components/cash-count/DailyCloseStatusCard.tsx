import Link from "next/link";
import {
  activeCashClosing,
  activeNetTotal,
  isTodayBusinessClosed,
} from "@/lib/utils/activeDayDisplay";
import { formatCurrency } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/Card";
import type { DailyCloseStatus } from "@/types";
import { cn } from "@/lib/utils/cn";
import { CheckCircle, CircleDashed, Lock, PiggyBank, Wallet } from "lucide-react";

interface DailyCloseStatusCardProps {
  status: DailyCloseStatus;
}

export function DailyCloseStatusCard({ status }: DailyCloseStatusCardProps) {
  const dayClosed = isTodayBusinessClosed(status);
  const statusLabel = dayClosed
    ? "ปิดยอดแล้ว"
    : status.hasManualCount
      ? "เปิดอยู่ · นับแล้ว"
      : "เปิดอยู่ · ยังไม่นับ";

  const StatusIcon = dayClosed ? Lock : status.hasManualCount ? CheckCircle : CircleDashed;
  const cashDisplay = activeCashClosing(status.cashClosing, status);
  const netDisplay = activeNetTotal(status.netTotal, status);

  return (
    <Link href="/cash-count" className="block h-full active:scale-[0.98] transition-transform">
      <Card className="h-full border-l-4 border-l-brand">
        <CardContent className="pos-stat-body space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="pos-stat-title text-base font-bold text-text-secondary">สถานะปิดยอดวันนี้</p>
              <p
                className={cn(
                  "mt-1 flex items-center gap-1.5 text-sm font-bold",
                  dayClosed ? "text-text-muted" : "text-brand"
                )}
              >
                <StatusIcon size={16} className="shrink-0" />
                {statusLabel}
              </p>
            </div>
            <div className="flex-shrink-0 rounded-2xl bg-brand-light p-3 text-brand shadow-sm">
              <Wallet size={28} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-text-muted">เงินสดใน POS</p>
              <p className="text-lg font-black text-brand">{formatCurrency(cashDisplay)}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-xs text-text-muted">
                <PiggyBank size={12} />
                โอน (สมุด)
              </p>
              <p className="text-lg font-black text-income">{formatCurrency(status.transferClosing)}</p>
            </div>
          </div>

          <p className="text-sm font-bold text-text-muted">
            สุทธิธุรกิจวันนี้{" "}
            <span className={netDisplay >= 0 ? "text-income" : "text-expense"}>
              {netDisplay >= 0 ? "+" : ""}
              {formatCurrency(netDisplay)}
            </span>
            <span className="font-normal"> · แตะเพื่อดูรายละเอียด</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
