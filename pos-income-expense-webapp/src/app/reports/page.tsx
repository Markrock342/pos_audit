import { AppLayout } from "@/components/layout/AppLayout";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { loadTransactions } from "@/lib/data/loader";
import { buildChartData } from "@/lib/reports/summary";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import { Coins, Wallet, TrendingUp } from "lucide-react";

function getFirstDayOfMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ReportsPage() {
  const start = getFirstDayOfMonth();
  const end = getToday();

  const transactions = await loadTransactions({
    startDate: start,
    endDate: end,
    status: "active",
  });

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const chartData = buildChartData(transactions);

  return (
    <AppLayout title="รายงาน">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              ช่วงวันที่: {formatDateShort(start)} — {formatDateShort(end)}
            </CardTitle>
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
            <CardTitle>รายงานเพิ่มเติม (Coming Soon)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-text-secondary">
              <li>ส่งออก PDF / Excel</li>
              <li>กรองตามหมวดหมู่และช่องทางชำระเงิน</li>
              <li>รายงานรายวัน / รายเดือน / รายปี</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
