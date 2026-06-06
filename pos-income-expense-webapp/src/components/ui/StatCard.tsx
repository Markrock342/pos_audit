import { Card, CardContent } from "./Card";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  icon?: string;
}

export function StatCard({ title, value, subtitle, trend, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="text-sm text-stone-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
          {subtitle && (
            <p
              className={cn(
                "mt-1 text-xs",
                trend === "up" && "text-green-600",
                trend === "down" && "text-red-600",
                trend === "neutral" && "text-stone-500"
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </CardContent>
    </Card>
  );
}
