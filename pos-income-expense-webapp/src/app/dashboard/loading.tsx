import { Skeleton, SkeletonCard, SkeletonChart } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-3 lg:p-4 2xl:p-6">
      <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4 2xl:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-[72px] rounded-2xl" />
        <Skeleton className="h-[72px] rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
        <div className="2xl:col-span-2">
          <SkeletonChart />
        </div>
        <SkeletonCard />
      </div>
    </div>
  );
}
