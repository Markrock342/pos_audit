import type { DashboardSummary } from "@/types";
import { formatCurrency } from "@/lib/utils/format";
import { StatCard } from "@/components/ui/StatCard";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="รายรับวันนี้"
        value={formatCurrency(summary.todayIncome)}
        icon="💰"
        trend="up"
      />
      <StatCard
        title="รายจ่ายวันนี้"
        value={formatCurrency(summary.todayExpense)}
        icon="💸"
        trend="down"
      />
      <StatCard
        title="กำไรสุทธิ (เดือนนี้)"
        value={formatCurrency(summary.netProfit)}
        subtitle={`รายรับ ${formatCurrency(summary.monthIncome)}`}
        icon="📊"
        trend={summary.netProfit >= 0 ? "up" : "down"}
      />
      <StatCard
        title="จำนวนรายการ"
        value={String(summary.transactionCount)}
        subtitle="รายการทั้งหมด (mock)"
        icon="📝"
        trend="neutral"
      />
    </div>
  );
}
