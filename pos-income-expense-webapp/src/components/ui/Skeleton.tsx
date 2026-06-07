import { cn } from "@/lib/utils/cn";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}

const roundedMap = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export function Skeleton({ className, rounded = "lg" }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-surface-hover",
        roundedMap[rounded],
        className
      )}
    />
  );
}

/* ─── Preset layouts ─── */

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border-2 border-border-default bg-surface-elevated p-6 shadow-md space-y-4">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Skeleton className="h-5 flex-1" />
        <Skeleton className="h-5 flex-1" />
        <Skeleton className="h-5 flex-1" />
        <Skeleton className="h-5 flex-1" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="rounded-2xl border-2 border-border-default bg-surface-elevated p-6 shadow-md">
      <Skeleton className="h-6 w-1/3 mb-6" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
