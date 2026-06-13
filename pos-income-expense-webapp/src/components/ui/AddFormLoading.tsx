import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export function AddFormLoading() {
  return (
    <div className="space-y-4 p-3 lg:p-4 2xl:p-6">
      <SkeletonCard />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        <Skeleton className="h-[280px] rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
