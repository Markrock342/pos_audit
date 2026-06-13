"use client";

import {
  cashCountDisplayBadgeClass,
  getCashCountDisplayLabel,
  isCashCountPending,
} from "@/lib/utils/cashCountVariance";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { CashCount } from "@/types";
import { cn } from "@/lib/utils/cn";
import { AlertTriangle, CheckCircle, CircleDashed, Lock, Scale } from "lucide-react";

interface CashCountDayMetaProps {
  cashCount: CashCount | null;
  expectedBalance: number;
}

export function CashCountDayMeta({ cashCount, expectedBalance }: CashCountDayMetaProps) {
  const pending = !cashCount || isCashCountPending(cashCount);
  const displayRow =
    cashCount ??
    ({
      status: "balanced" as const,
      hasManualCount: false,
      closedAt: undefined,
    } satisfies Pick<CashCount, "status" | "hasManualCount" | "closedAt">);

  return (
    <Card className="border-l-4 border-l-text-muted">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale size={20} className="text-text-muted" />
          การนับเงินสด
        </CardTitle>
        <p className="text-xs text-text-muted">ไม่บังคับ — ระบบปิดอัตโนมัติใช้ยอดคำนวณ</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-surface-inset p-4">
            <p className="text-xs text-text-muted">ยอดคาดหวัง (สด)</p>
            <p className="text-xl font-black text-brand">{formatCurrency(expectedBalance)}</p>
          </div>
          <div className="rounded-xl bg-surface-inset p-4">
            <p className="text-xs text-text-muted">ยอดที่นับได้</p>
            <p className="text-xl font-black text-text-main">
              {pending ? "—" : formatCurrency(cashCount!.actualBalance)}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex items-start gap-3 rounded-xl px-4 py-3",
            cashCountDisplayBadgeClass(displayRow)
          )}
        >
          {pending ? (
            <CircleDashed size={20} className="mt-0.5 shrink-0" />
          ) : cashCount!.status === "balanced" ? (
            <CheckCircle size={20} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          )}
          <div className="min-w-0 space-y-1">
            <p className="font-bold">{cashCount ? getCashCountDisplayLabel(cashCount) : "ยังไม่ได้นับ"}</p>
            {!pending && cashCount!.status !== "balanced" && (
              <p className="text-sm">
                ส่วนต่าง: {cashCount!.variance >= 0 ? "+" : ""}
                {formatCurrency(cashCount!.variance)}
              </p>
            )}
            {cashCount?.closedAt && (
              <p className="flex flex-wrap items-center gap-1 text-xs opacity-90">
                <Lock size={12} />
                ปิด {formatDateTime(cashCount.closedAt)}
                {cashCount.autoClosed ? " · ปิดอัตโนมัติ" : ""}
              </p>
            )}
            {cashCount?.note && (
              <p className="text-sm opacity-90">หมายเหตุ: {cashCount.note}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
