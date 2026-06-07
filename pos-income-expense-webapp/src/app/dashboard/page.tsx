import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { SummaryCards } from "@/components/SummaryCards";
import { RecentTransactionList } from "@/components/RecentTransactionList";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowUpCircle, ArrowDownCircle, TrendingUp } from "lucide-react";
import { loadCategories, loadTransactions } from "@/lib/data/loader";
import { buildChartData, buildDashboardSummary } from "@/lib/reports/summary";

export default async function DashboardPage() {
  const [transactions, categories] = await Promise.all([
    loadTransactions({ status: "active" }),
    loadCategories(),
  ]);

  const summary = buildDashboardSummary(transactions);
  const chartData = buildChartData(transactions);
  const recentTransactions = transactions.slice(0, 5);

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <SummaryCards summary={summary} />

        <div className="grid grid-cols-2 gap-4">
          <Link href="/income/add">
            <Button variant="income" size="lg" className="w-full gap-3 text-xl font-black">
              <ArrowUpCircle size={28} />
              เพิ่มรายรับ
            </Button>
          </Link>
          <Link href="/expense/add">
            <Button variant="danger" size="lg" className="w-full gap-3 text-xl font-black">
              <ArrowDownCircle size={28} />
              เพิ่มรายจ่าย
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
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
              <Link href="/reports">
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
