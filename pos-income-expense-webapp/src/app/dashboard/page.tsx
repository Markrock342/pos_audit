import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardLiveSummary } from "@/components/dashboard/DashboardLiveSummary";
import { Button } from "@/components/ui/Button";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { loadDashboardPageData } from "@/lib/data/loader";

/** ไม่ cache SSR — ยอด POS อัปเดตจาก client หลังฝาก/บันทึกรายการ */
export const revalidate = 0;

export default async function DashboardPage() {
  const { dashboardData, todayLedger } = await loadDashboardPageData();

  const summary = {
    todayIncome: dashboardData.todayIncome,
    todayExpense: dashboardData.todayExpense,
    monthIncome: dashboardData.monthIncome,
    monthExpense: dashboardData.monthExpense,
    netProfit: dashboardData.netProfit,
    transactionCount: dashboardData.transactionCount,
    expectedCashBalance: dashboardData.expectedCashBalance,
  };

  return (
    <AppLayout title="ภาพรวม">
      <div className="pos-page gap-3 2xl:gap-4">
        <DashboardLiveSummary
          initialSummary={summary}
          initialStatus={dashboardData.dailyCloseStatus}
          initialLedger={todayLedger}
        />

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
      </div>
    </AppLayout>
  );
}
