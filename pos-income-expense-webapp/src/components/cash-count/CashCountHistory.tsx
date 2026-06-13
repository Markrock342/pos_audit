"use client";

import { useEffect, useState } from "react";
import { fetchCashCounts } from "@/lib/api/client";
import {
  cashCountDisplayBadgeClass,
  getCashCountDisplayLabel,
  isCashCountPending,
} from "@/lib/utils/cashCountVariance";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { CashCount } from "@/types";
import { cn } from "@/lib/utils/cn";
import { History, CheckCircle, AlertTriangle, Lock, CircleDashed } from "lucide-react";

interface CashCountHistoryProps {
  refreshKey?: number;
}

export function CashCountHistory({ refreshKey = 0 }: CashCountHistoryProps) {
  const [history, setHistory] = useState<CashCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCashCounts()
      .then((rows) => setHistory([...rows].sort((a, b) => b.countDate.localeCompare(a.countDate))))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2">
          <History size={22} className="text-text-muted" />
          ประวัติปิดยอดย้อนหลัง
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-text-muted">กำลังโหลด...</p>
        ) : history.length === 0 ? (
          <p className="py-4 text-center text-text-muted">ยังไม่มีประวัติปิดยอด</p>
        ) : (
          <div className="space-y-2">
            {history.map((row) => (
              <div
                key={row.id}
                className="tablet-touch-row flex items-center justify-between gap-4 rounded-2xl border-2 border-border-default px-4"
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
                    {row.autoClosed && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                        ปิดอัตโนมัติ
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted">
                    คาด {formatCurrency(row.expectedBalance)}
                    {isCashCountPending(row)
                      ? " · ยังไม่ได้นับ"
                      : ` → นับ ${formatCurrency(row.actualBalance)}`}
                  </p>
                  {!isCashCountPending(row) && row.status !== "balanced" && (
                    <p className="text-xs text-text-muted">
                      ส่วนต่าง: {row.variance >= 0 ? "+" : ""}
                      {formatCurrency(row.variance)}
                    </p>
                  )}
                </div>
                <div
                  className={cn(
                    "flex max-w-[9rem] shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold leading-tight sm:max-w-none sm:text-sm",
                    cashCountDisplayBadgeClass(row)
                  )}
                >
                  {isCashCountPending(row) ? (
                    <CircleDashed size={18} className="shrink-0" />
                  ) : row.status === "balanced" ? (
                    <CheckCircle size={18} className="shrink-0" />
                  ) : (
                    <AlertTriangle size={18} className="shrink-0" />
                  )}
                  {getCashCountDisplayLabel(row)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
