import { Card, CardContent } from "./Card";
import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
}

const iconBgMap = {
  up: "bg-income-light text-income",
  down: "bg-expense-light text-expense",
  neutral: "bg-brand-light text-brand",
};

export function StatCard({ title, value, subtitle, trend, icon: Icon }: StatCardProps) {
  return (
    <Card className="border-l-4 border-l-brand">
      <CardContent className="pos-stat-body flex min-h-[120px] items-start justify-between 2xl:min-h-[96px]">
        <div className="min-w-0 flex-1">
          <p className="pos-stat-title text-base font-bold text-text-secondary">{title}</p>
          <p className="pos-stat-value mt-2 text-2xl font-black tracking-tight text-text-main 2xl:text-3xl">{value}</p>
          {subtitle && (
            <p
              className={cn(
                "mt-2 text-sm font-bold",
                trend === "up" && "text-income",
                trend === "down" && "text-expense",
                trend === "neutral" && "text-text-muted"
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("flex-shrink-0 rounded-2xl p-3 shadow-sm", iconBgMap[trend ?? "neutral"])}>
            <Icon size={32} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
