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
      <CardContent className="flex items-start justify-between min-h-[120px]">
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-text-secondary">{title}</p>
          <p className="mt-2 text-4xl font-black text-text-main tracking-tight">{value}</p>
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
