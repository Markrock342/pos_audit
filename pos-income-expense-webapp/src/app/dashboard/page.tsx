import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { DailyCloseStatusCard } from "@/components/cash-count/DailyCloseStatusCard";
import { DailyFlowGuideCard } from "@/components/guide/DailyFlowGuideCard";
import { SummaryCards } from "@/components/SummaryCards";
import { RecentTransactionList } from "@/components/RecentTransactionList";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChartLazy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowUpCircle, ArrowDownCircle, TrendingUp } from "lucide-react";
import { loadCategories, loadChartTransactions, loadRecentTransactions } from "@/lib/data/loader";
import { buildChartData } from "@/lib/reports/summary";
import { getDashboard } from "@/lib/services/db/reports";

// โหลดยอด/รายการสดทุกครั้ง — ไม่ prerender ค้างตั้งแต่ตอน build
export const dynamic = "force-dynamic";

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
      <div className="pos-page gap-3 2xl:gap-4">
        <div className="pos-stat-compact shrink-0">
          <SummaryCards summary={summary} />
        </div>

        <div className="shrink-0">
          <DailyCloseStatusCard status={dashboardData.dailyCloseStatus} />
        </div>

        <div className="shrink-0">
          <DailyFlowGuideCard />
        </div>

        <div className="pos-dashboard-actions grid shrink-0 grid-cols-2 gap-3 2xl:gap-3">
          <Link href="/income/add" prefetch>
            <Button variant="income" size="lg" className="min-h-[72px] w-full gap-2 text-lg font-black 2xl:min-h-[56px] 2xl:gap-2 2xl:text-lg">
              <ArrowUpCircle size={24} className="2xl:w-6" />
              เพิ่มรายรับ
            </Button>
          </Link>
          <Link href="/expense/add" prefetch>
            <Button variant="danger" size="lg" className="min-h-[72px] w-full gap-2 text-lg font-black 2xl:min-h-[56px] 2xl:gap-2 2xl:text-lg">
              <ArrowDownCircle size={24} className="2xl:w-6" />
              เพิ่มรายจ่าย
            </Button>
          </Link>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 2xl:grid-cols-3 2xl:gap-4">
          <Card className="flex min-h-0 flex-col 2xl:col-span-2">
            <CardHeader className="shrink-0 pb-2 2xl:py-3">
              <CardTitle className="flex items-center gap-2 text-lg font-black 2xl:text-xl">
                <TrendingUp size={20} className="text-brand 2xl:h-5 2xl:w-5" />
                สรุปรายรับ-รายจ่าย (6 วันล่าสุด)
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 pb-4">
              <IncomeExpenseChart data={chartData} className="pos-chart-compact" />
            </CardContent>
          </Card>

          <Card className="flex min-h-0 flex-col">
            <CardHeader className="flex shrink-0 flex-row items-center justify-between py-3">
              <CardTitle className="text-lg font-black 2xl:text-xl">รายการล่าสุด</CardTitle>
              <Link href="/reports" prefetch>
                <Button variant="ghost" className="font-bold text-brand">
                  ดูทั้งหมด
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pos-scroll min-h-0 flex-1 pb-4">
              {recentTransactions.length === 0 ? (
                <p className="py-6 text-center text-text-muted">ยังไม่มีรายการ — เริ่มบันทึกรายรับ/รายจ่ายได้เลย</p>
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
