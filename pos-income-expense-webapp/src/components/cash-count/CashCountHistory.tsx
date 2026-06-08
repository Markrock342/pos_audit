"use client";

import { useEffect, useState } from "react";
import { fetchCashCounts } from "@/lib/api/client";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { CashCount } from "@/types";
import { cn } from "@/lib/utils/cn";
import { History, CheckCircle, AlertTriangle } from "lucide-react";

const STATUS_LABEL: Record<CashCount["status"], string> = {
  balanced: "ตรงยอด",
  short: "ขาดเงิน",
  overage: "เกินเงิน",
};

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
    <Card>
      <CardHeader>
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
                className="flex items-center justify-between gap-4 rounded-xl border border-border-default px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-bold text-text-main">{formatDateShort(row.countDate)}</p>
                  <p className="text-sm text-text-muted">
                    คาด {formatCurrency(row.expectedBalance)} → นับ {formatCurrency(row.actualBalance)}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold",
                    row.status === "balanced" ? "bg-income-light text-income" : "bg-expense-light text-expense"
                  )}
                >
                  {row.status === "balanced" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  {STATUS_LABEL[row.status]}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
