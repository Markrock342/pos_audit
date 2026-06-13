"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchBalanceSummary } from "@/lib/api/client";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import type { BalanceSummary } from "@/types";
import { ArrowDownCircle, ArrowUpCircle, Banknote, PiggyBank, Settings, Wallet } from "lucide-react";

function getFirstDayOfMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function BalanceSummaryView() {
  const [start, setStart] = useState(getFirstDayOfMonth());
  const [end, setEnd] = useState(getToday());
  const [data, setData] = useState<BalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchBalanceSummary(start, end));
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดสรุปยอดไม่สำเร็จ");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasOpening = (data?.openingCash ?? 0) > 0 || (data?.openingSavings ?? 0) > 0;

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl bg-error-light px-4 py-3 text-sm font-bold text-error">{error}</p>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>ช่วงวันที่</CardTitle>
            <p className="mt-1 text-sm text-text-muted">
              {formatDateShort(start)} — {formatDateShort(end)}
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
            <Input
              label="ตั้งแต่"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="tablet-touch-input"
            />
            <Input
              label="ถึง"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="tablet-touch-input"
            />
            <Button
              variant="outline"
              onClick={load}
              disabled={loading}
              className="col-span-2 min-h-[52px] sm:col-span-1"
            >
              {loading ? "กำลังโหลด..." : "อัปเดต"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {loading && !data ? (
        <p className="py-12 text-center text-text-muted">กำลังโหลด...</p>
      ) : data ? (
        <>
          <Card className="border-t-4 border-t-brand">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wallet size={22} className="text-brand" />
                ยอดเงินยกมา
              </CardTitle>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
              >
                <Settings size={16} />
                ตั้งค่ายอดยกมา
              </Link>
            </CardHeader>
            <CardContent>
              {hasOpening ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-surface-inset p-4">
                    <p className="text-sm text-text-muted">เงินสดยกมา</p>
                    <p className="text-2xl font-black text-text-main">
                      {formatCurrency(data.openingCash)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-inset p-4">
                    <p className="text-sm text-text-muted">โอน (ยอดยกมา)</p>
                    <p className="text-2xl font-black text-text-main">
                      {formatCurrency(data.openingSavings)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">
                  ยังไม่ตั้งยอดยกมา —{" "}
                  <Link href="/settings" className="font-bold text-brand hover:underline">
                    ไปตั้งค่า
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-l-4 border-l-income">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-income">
                  <ArrowUpCircle size={22} />
                  สรุปรายรับ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-income">
                  {formatCurrency(data.totalIncome)}
                </p>
                <div className="mt-3 space-y-1 text-sm text-text-secondary">
                  <p>เงินสด: {formatCurrency(data.cashIncome)}</p>
                  <p>โอน (ตามรายการ): {formatCurrency(data.savingsIncome)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-expense">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-expense">
                  <ArrowDownCircle size={22} />
                  สรุปรายจ่าย
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-expense">
                  {formatCurrency(data.totalExpense)}
                </p>
                <div className="mt-3 space-y-1 text-sm text-text-secondary">
                  <p>เงินสด: {formatCurrency(data.cashExpense)}</p>
                  <p>โอน (ตามรายการ): {formatCurrency(data.savingsExpense)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-brand/30 bg-brand/5">
            <CardHeader>
              <CardTitle>ยอดเงินคงเหลือ</CardTitle>
              <p className="text-sm text-text-muted">ยอดยกมา + รายรับ − รายจ่าย</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="tablet-touch-row flex items-center justify-between rounded-2xl border-2 border-border-default bg-surface-elevated px-5">
                <span className="inline-flex items-center gap-2 text-base font-bold">
                  <Banknote size={22} className="text-brand" />
                  เงินสด
                </span>
                <span className="text-2xl font-black">{formatCurrency(data.cashBalance)}</span>
              </div>
              <div className="tablet-touch-row flex items-center justify-between rounded-2xl border-2 border-border-default bg-surface-elevated px-5">
                <span className="inline-flex items-center gap-2 text-base font-bold">
                  <PiggyBank size={22} className="text-brand" />
                  โอน (ตามรายการ)
                </span>
                <span className="text-2xl font-black">{formatCurrency(data.savingsBalance)}</span>
              </div>
              <div className="flex min-h-[72px] items-center justify-between rounded-2xl bg-brand px-5 py-5 text-white">
                <span className="text-lg font-bold">รวมเงินคงเหลือทั้งหมด</span>
                <span className="text-3xl font-black">{formatCurrency(data.totalBalance)}</span>
              </div>
            </CardContent>
          </Card>

        </>
      ) : null}
    </div>
  );
}
