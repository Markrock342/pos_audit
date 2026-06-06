import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { SummaryCards } from "@/components/SummaryCards";
import { TransactionTable } from "@/components/tables/TransactionTable";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  mockCategories,
  mockChartData,
  mockDashboardSummary,
  mockTransactions,
} from "@/data/mock";

export default function DashboardPage() {
  const recentTransactions = mockTransactions.slice(0, 5);

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <SummaryCards summary={mockDashboardSummary} />

        <div className="flex flex-wrap gap-3">
          <Link href="/income/add">
            <Button>+ เพิ่มรายรับ</Button>
          </Link>
          <Link href="/expense/add">
            <Button variant="secondary">+ เพิ่มรายจ่าย</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>สรุปรายรับ-รายจ่าย (6 วันล่าสุด)</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={mockChartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>รายการล่าสุด</CardTitle>
            <Link href="/income">
              <Button variant="ghost" size="sm">
                ดูทั้งหมด
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <TransactionTable
              transactions={recentTransactions}
              categories={mockCategories}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
