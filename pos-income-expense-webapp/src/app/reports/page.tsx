import { AppLayout } from "@/components/layout/AppLayout";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { mockChartData, mockReportSummary } from "@/data/mock";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";

export default function ReportsPage() {
  const { totalIncome, totalExpense, netProfit, dateRange } = mockReportSummary;

  return (
    <AppLayout title="รายงาน">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              ช่วงวันที่: {formatDateShort(dateRange.start)} —{" "}
              {formatDateShort(dateRange.end)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                title="รายรับรวม"
                value={formatCurrency(totalIncome)}
                trend="up"
                icon="💰"
              />
              <StatCard
                title="รายจ่ายรวม"
                value={formatCurrency(totalExpense)}
                trend="down"
                icon="💸"
              />
              <StatCard
                title="กำไรสุทธิ"
                value={formatCurrency(netProfit)}
                trend={netProfit >= 0 ? "up" : "down"}
                icon="📈"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>กราฟรายรับ-รายจ่าย</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={mockChartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>รายงานเพิ่มเติม (Coming Soon)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-stone-600">
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
