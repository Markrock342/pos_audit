"use client";

import { useCallback, useEffect, useState } from "react";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  downloadReportCsv,
  fetchByCategoryReport,
  fetchReportSummary,
  type CategoryReportItem,
} from "@/lib/api/client";
import { buildChartData } from "@/lib/reports/summary";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import { Coins, Wallet, TrendingUp, Download } from "lucide-react";
import type { ReportSummary, Transaction } from "@/types";

function getFirstDayOfMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

interface ReportsViewProps {
  initialTransactions: Transaction[];
}

export function ReportsView({ initialTransactions }: ReportsViewProps) {
  const [start, setStart] = useState(getFirstDayOfMonth());
  const [end, setEnd] = useState(getToday());
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [byCategory, setByCategory] = useState<CategoryReportItem[]>([]);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, cats] = await Promise.all([
        fetchReportSummary(start, end),
        fetchByCategoryReport(start, end),
      ]);
      setSummary(sum);
      setByCategory(cats);
      const res = await fetch(
        `/api/transactions?startDate=${start}&endDate=${end}&status=active`
      );
      const json = (await res.json()) as { data: Transaction[] };
      setTransactions(json.data.filter((t) => t.status === "active"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดรายงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = buildChartData(transactions);
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const netProfit = summary?.netProfit ?? 0;

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      await downloadReportCsv(start, end);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ส่งออกไม่สำเร็จ");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl bg-error-light px-4 py-3 text-sm font-bold text-error">{error}</p>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>ช่วงวันที่รายงาน</CardTitle>
            <p className="mt-1 text-sm text-text-muted">
              {formatDateShort(start)} — {formatDateShort(end)}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="ตั้งแต่"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <Input
              label="ถึง"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? "กำลังโหลด..." : "อัปเดต"}
            </Button>
            <Button onClick={handleExport} disabled={exporting} className="gap-2">
              <Download size={18} />
              {exporting ? "กำลังส่งออก..." : "ส่งออก CSV"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="รายรับรวม" value={formatCurrency(totalIncome)} trend="up" icon={Coins} />
            <StatCard title="รายจ่ายรวม" value={formatCurrency(totalExpense)} trend="down" icon={Wallet} />
            <StatCard
              title="กำไรสุทธิ"
              value={formatCurrency(netProfit)}
              trend={netProfit >= 0 ? "up" : "down"}
              icon={TrendingUp}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>กราฟรายรับ-รายจ่าย</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeExpenseChart data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>สรุปตามหมวดหมู่</CardTitle>
        </CardHeader>
        <CardContent>
          {byCategory.length === 0 ? (
            <p className="py-6 text-center text-text-muted">ไม่มีรายการในช่วงวันที่นี้</p>
          ) : (
            <div className="space-y-2">
              {byCategory.map((row) => (
                <div
                  key={row.categoryId}
                  className="flex items-center justify-between rounded-xl border border-border-default px-4 py-3"
                >
                  <span className="inline-flex items-center gap-2 font-medium">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: row.categoryColor }}
                    />
                    {row.categoryName}
                    <span
                      className={
                        row.type === "income"
                          ? "text-xs text-income"
                          : "text-xs text-expense"
                      }
                    >
                      ({row.type === "income" ? "รายรับ" : "รายจ่าย"})
                    </span>
                  </span>
                  <span className="font-bold">
                    {formatCurrency(row.total)}{" "}
                    <span className="text-sm font-normal text-text-muted">({row.count} รายการ)</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
