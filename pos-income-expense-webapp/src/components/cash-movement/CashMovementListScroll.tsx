"use client";

import { Children, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { ChevronDown, ChevronUp } from "lucide-react";

const DEFAULT_LIMIT = 5;

interface CashMovementListScrollProps {
  children: ReactNode;
  className?: string;
  /** จำนวนที่แสดงตอนยุบ — default 5 */
  limit?: number;
}

/** รายการฝาก/ถอน — แสดงสูงสุด 5 รายการ กดดูทั้งหมด/ยุบได้ */
export function CashMovementListScroll({
  children,
  className,
  limit = DEFAULT_LIMIT,
}: CashMovementListScrollProps) {
  const [expanded, setExpanded] = useState(false);
  const all = Children.toArray(children);
  const hasMore = all.length > limit;
  const visible = !hasMore || expanded ? all : all.slice(0, limit);
  const scrollWhenExpanded = expanded && all.length > limit + 2;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "space-y-2",
          scrollWhenExpanded &&
            "pos-movement-list-scroll max-h-[min(16rem,38vh)] overflow-y-auto overscroll-y-auto"
        )}
      >
        {visible}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border-default bg-surface-inset px-3 py-2.5 text-xs font-bold text-brand transition-colors hover:bg-surface-hover active:scale-[0.99]"
        >
          {expanded ? (
            <>
              <ChevronUp size={16} />
              ยุบ
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              ดูทั้งหมด ({all.length} รายการ)
            </>
          )}
        </button>
      )}
    </div>
  );
}
