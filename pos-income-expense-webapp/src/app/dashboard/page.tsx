import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { SummaryCards } from "@/components/SummaryCards";
import { RecentTransactionList } from "@/components/RecentTransactionList";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChartLazy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowUpCircle, ArrowDownCircle, TrendingUp } from "lucide-react";
import { loadCategories, loadChartTransactions, loadRecentTransactions } from "@/lib/data/loader";
import { buildChartData } from "@/lib/reports/summary";
import { getDashboard } from "@/lib/services/db/reports";

export default async function DashboardPage() {
  const [chartTransactions, categories, dashboardData, recentTransactions] = await Promise.all([
    loadChartTransactions(6),
    loadCategories(),
    getDashboard(),
    loadRecentTransactions(5),
  ]);

  const summary = {
    todayIncome: dashboardData.todayIncome,
    todayExpense: dashboardData.todayExpense,
    monthIncome: dashboardData.monthIncome,
    monthExpense: dashboardData.monthExpense,
    netProfit: dashboardData.netProfit,
    transactionCount: dashboardData.transactionCount,
    expectedCashBalance: dashboardData.expectedCashBalance,
  };
  const chartData = buildChartData(chartTransactions);

  return (
    <AppLayout title="ภาพรวม">
      <div className="space-y-6">
        <SummaryCards summary={summary} />

        <div className="grid grid-cols-2 gap-3 2xl:gap-4">
          <Link href="/income/add" prefetch>
            <Button variant="income" size="lg" className="min-h-[72px] w-full gap-2 text-lg font-black 2xl:min-h-[64px] 2xl:gap-3 2xl:text-xl">
              <ArrowUpCircle size={26} className="2xl:w-7" />
              เพิ่มรายรับ
            </Button>
          </Link>
          <Link href="/expense/add" prefetch>
            <Button variant="danger" size="lg" className="min-h-[72px] w-full gap-2 text-lg font-black 2xl:min-h-[64px] 2xl:gap-3 2xl:text-xl">
              <ArrowDownCircle size={26} className="2xl:w-7" />
              เพิ่มรายจ่าย
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
          <Card className="2xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <TrendingUp size={22} className="text-brand" />
                สรุปรายรับ-รายจ่าย (6 วันล่าสุด)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IncomeExpenseChart data={chartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-black">รายการล่าสุด</CardTitle>
              <Link href="/reports" prefetch>
                <Button variant="ghost" className="font-bold text-brand">
                  ดูทั้งหมด
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="text-center text-text-muted py-8">ยังไม่มีรายการ — เริ่มบันทึกรายรับ/รายจ่ายได้เลย</p>
              ) : (
                <RecentTransactionList
                  transactions={recentTransactions}
                  categories={categories}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
