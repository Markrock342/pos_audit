import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";

function StatSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-default bg-surface-elevated border-l-4 border-l-brand/30",
        className
      )}
    >
      <div className="pos-stat-body flex min-h-[120px] items-start justify-between p-4 2xl:min-h-[96px]">
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="skeleton-soft h-4 w-24" rounded="md" />
          <Skeleton className="skeleton-soft h-8 w-28" rounded="md" />
        </div>
        <Skeleton className="skeleton-soft h-14 w-14 shrink-0" rounded="xl" />
      </div>
    </div>
  );
}

/** โครงเดียวกับ dashboard/page.tsx — ใช้ตอน route loading */
export function DashboardPageSkeleton() {
  return (
    <AppLayout title="ภาพรวม">
      <div className="pos-page gap-3 2xl:gap-4">
        <div className="pos-stat-compact shrink-0">
          <div className="grid grid-cols-2 gap-3 2xl:grid-cols-3 2xl:gap-4">
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton className="col-span-2 2xl:col-span-1" />
          </div>
        </div>

        <Card className="shrink-0 border-t-4 border-t-brand/30">
          <CardHeader className="pb-2">
            <Skeleton className="skeleton-soft h-5 w-44" rounded="md" />
            <Skeleton className="skeleton-soft mt-2 h-3 w-64" rounded="md" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="skeleton-soft h-4 w-full max-w-xs" rounded="md" />
            <Skeleton className="skeleton-soft h-4 w-full max-w-sm" rounded="md" />
            <Skeleton className="skeleton-soft h-4 w-32" rounded="md" />
          </CardContent>
        </Card>

        <div className="pos-dashboard-actions grid shrink-0 grid-cols-2 gap-3 2xl:gap-3">
          <Skeleton className="skeleton-soft min-h-[72px] rounded-2xl 2xl:min-h-[56px]" />
          <Skeleton className="skeleton-soft min-h-[72px] rounded-2xl 2xl:min-h-[56px]" />
        </div>
      </div>
    </AppLayout>
  );
}
