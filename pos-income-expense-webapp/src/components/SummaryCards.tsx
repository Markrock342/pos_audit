import Link from "next/link";
import type { DashboardSummary, DailyCloseStatus } from "@/types";
import { formatCurrency } from "@/lib/utils/format";
import { isTodayBusinessClosed } from "@/lib/utils/activeDayDisplay";
import { StatCard } from "@/components/ui/StatCard";
import { DollarSign, ArrowDownCircle, TrendingUp, Wallet } from "lucide-react";

interface SummaryCardsProps {
  summary: DashboardSummary;
  dailyCloseStatus?: DailyCloseStatus;
}

export function SummaryCards({ summary, dailyCloseStatus }: SummaryCardsProps) {
  const dayClosed = dailyCloseStatus ? isTodayBusinessClosed(dailyCloseStatus) : false;

  return (
    <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4 2xl:gap-4">
      <StatCard
        title="รายรับวันนี้"
        value={formatCurrency(summary.todayIncome)}
        subtitle={dayClosed ? "ปิดยอดแล้ว · ดูที่ สรุปปิดยอด" : undefined}
        icon={DollarSign}
        trend="up"
      />
      <StatCard
        title="รายจ่ายวันนี้"
        value={formatCurrency(summary.todayExpense)}
        subtitle={dayClosed ? "ปิดยอดแล้ว · ดูที่ สรุปปิดยอด" : undefined}
        icon={ArrowDownCircle}
        trend="down"
      />
      <StatCard
        title="กำไรสุทธิ (เดือนนี้)"
        value={formatCurrency(summary.netProfit)}
        subtitle={`รายรับ ${formatCurrency(summary.monthIncome)}`}
        icon={TrendingUp}
        trend={summary.netProfit >= 0 ? "up" : "down"}
      />
      <Link href="/cash-count" className="block active:scale-[0.98] transition-transform">
        <StatCard
          title="เงินสดใน POS"
          value={formatCurrency(summary.expectedCashBalance ?? 0)}
          subtitle={dayClosed ? "เคลียร์ลิ้นชักแล้ว" : "เงินในลิ้นชักวันนี้"}
          icon={Wallet}
          trend="neutral"
        />
      </Link>
    </div>
  );
}
