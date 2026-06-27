import Link from "next/link";
import type { DashboardSummary } from "@/types";
import { formatCurrency } from "@/lib/utils/format";
import { StatCard } from "@/components/ui/StatCard";
import { DollarSign, ArrowDownCircle, Wallet } from "lucide-react";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 2xl:grid-cols-3 2xl:gap-4">
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
      <Link
        href="/pos-cash"
        className="col-span-2 block active:scale-[0.98] transition-transform 2xl:col-span-1"
      >
        <StatCard
          title="เงินสดใน POS"
          value={formatCurrency(summary.expectedCashBalance ?? 0)}
          subtitle="เงินในลิ้นชักวันนี้"
          icon={Wallet}
          trend="neutral"
        />
      </Link>
    </div>
  );
}
