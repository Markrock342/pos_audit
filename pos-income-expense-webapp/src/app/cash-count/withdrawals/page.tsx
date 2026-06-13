"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { fetchCashWithdrawals } from "@/lib/api/client";
import { formatCurrency, formatDateShort, formatDateTime, formatWithdrawalAmount } from "@/lib/utils/format";
import type { CashWithdrawal } from "@/types";
import { ArrowLeft, ArrowDownCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function getDefaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function CashWithdrawHistoryPage() {
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [endDate, setEndDate] = useState(getToday);
  const [items, setItems] = useState<CashWithdrawal[]>([]);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCashWithdrawals({ startDate, endDate });
      setItems(result.data);
      setTotalWithdrawn(result.totalWithdrawn);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดประวัติไม่สำเร็จ");
      setItems([]);
      setTotalWithdrawn(0);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppLayout title="ประวัติการถอนเงิน" subtitle="เงินสดที่นำออกจาก POS">
      <div className="mx-auto max-w-3xl space-y-6 pb-24">
        <Link
          href="/cash-count"
          className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline"
        >
          <ArrowLeft size={16} />
          กลับหน้าปิดยอด
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownCircle size={22} className="text-expense" />
              ช่วงวันที่
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Input
              label="ตั้งแต่"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="ถึง"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Button className="sm:col-span-2" onClick={() => void load()} disabled={loading}>
              {loading ? "กำลังโหลด..." : "ค้นหา"}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <p className="rounded-xl bg-error-light px-4 py-3 text-sm font-bold text-error">{error}</p>
        )}

        <Card className="border-l-4 border-l-expense">
          <CardHeader>
            <CardTitle>สรุปช่วงที่เลือก</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-muted">
              {formatDateShort(startDate)} – {formatDateShort(endDate)}
            </p>
            <p className="mt-2 text-3xl font-black text-expense">
              {loading ? "…" : formatWithdrawalAmount(totalWithdrawn)}
            </p>
            {!loading && (
              <p className="mt-1 text-sm text-text-muted">{items.length} รายการ</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>รายการ</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-text-muted">กำลังโหลด...</p>
            ) : items.length === 0 ? (
              <p className="py-6 text-center text-text-muted">ไม่พบรายการในช่วงนี้</p>
            ) : (
              <div className="space-y-2">
                {items.map((row) => (
                  <div
                    key={row.id}
                    className="tablet-touch-row flex items-start justify-between gap-4 rounded-2xl border-2 border-border-default px-4"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-text-main">{row.note}</p>
                      <p className="text-sm text-text-muted">
                        {formatDateShort(row.withdrawalDate)}
                        {row.createdAt ? ` · ${formatDateTime(row.createdAt)}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-lg font-black text-expense">
                      −{formatCurrency(row.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
