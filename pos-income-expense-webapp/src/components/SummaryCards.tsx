import Link from "next/link";
import type { DashboardSummary } from "@/types";
import { formatCurrency } from "@/lib/utils/format";
import { StatCard } from "@/components/ui/StatCard";
import { DollarSign, ArrowDownCircle, TrendingUp, Wallet } from "lucide-react";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="รายรับวันนี้"
        value={formatCurrency(summary.todayIncome)}
        icon={DollarSign}
        trend="up"
      />
      <StatCard
        title="รายจ่ายวันนี้"
        value={formatCurrency(summary.todayExpense)}
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
          title="เงินสดวันนี้ (ควรมี)"
          value={formatCurrency(summary.expectedCashBalance ?? 0)}
          subtitle="ไปนับเงินสด"
          icon={Wallet}
          trend="neutral"
        />
      </Link>
    </div>
  );
}
