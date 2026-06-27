import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  cashCountDisplayBadgeClass,
  getCashCountDisplayLabel,
  isCashCountPending,
} from "@/lib/utils/cashCountVariance";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { CashCount } from "@/types";
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  CircleDashed,
  Lock,
  Wallet,
} from "lucide-react";

interface DashboardCloseHistoryPanelProps {
  items: CashCount[];
}

export function DashboardCloseHistoryPanel({ items }: DashboardCloseHistoryPanelProps) {
  return (
    <Card className="flex min-h-0 flex-col">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between py-3">
        <CardTitle className="flex items-center gap-2 text-lg font-black 2xl:text-xl">
          <Wallet size={20} className="text-text-muted 2xl:h-5 2xl:w-5" />
          ประวัติปิดยอด
        </CardTitle>
        <Link href="/history?tab=close" prefetch>
          <Button variant="ghost" className="font-bold text-brand">
            ดูทั้งหมด
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pos-scroll min-h-0 flex-1 pb-4">
        {items.length === 0 ? (
          <p className="py-6 text-center text-text-muted">ยังไม่มีประวัติปิดยอด</p>
        ) : (
          <div className="space-y-2">
            {items.map((row) => {
              const pending = isCashCountPending(row);
              return (
                <Link
                  key={row.id}
                  href={`/cash-count/${row.countDate}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border-default bg-surface-elevated px-3 py-3 transition-colors hover:border-brand hover:bg-brand/5 active:scale-[0.99] sm:px-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-bold text-text-main sm:text-base">
                        {formatDateShort(row.countDate)}
                      </p>
                      {row.closedAt && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-inset px-2 py-0.5 text-[10px] text-text-muted sm:text-xs">
                          <Lock size={10} />
                          ปิดแล้ว
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-text-muted sm:text-sm">
                      คำนวณ {formatCurrency(row.expectedBalance)}
                      {pending ? " · ยังไม่ได้นับ" : ` → นับ ${formatCurrency(row.actualBalance)}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-bold sm:text-xs",
                        cashCountDisplayBadgeClass(row)
                      )}
                    >
                      {pending ? (
                        <CircleDashed size={14} />
                      ) : row.status === "balanced" ? (
                        <CheckCircle size={14} />
                      ) : (
                        <AlertTriangle size={14} />
                      )}
                      {getCashCountDisplayLabel(row)}
                    </span>
                    <ChevronRight size={16} className="text-text-muted" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
