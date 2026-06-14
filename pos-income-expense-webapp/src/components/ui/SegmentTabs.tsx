"use client";

import { cn } from "@/lib/utils/cn";

export type SegmentTab = { id: string; label: string };

interface SegmentTabsProps {
  tabs: SegmentTab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function SegmentTabs({ tabs, active, onChange, className }: SegmentTabsProps) {
  return (
    <div
      className={cn("flex gap-1 rounded-xl bg-surface-inset p-1", className)}
      role="tablist"
      aria-label="แท็บเนื้อหา"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "min-h-[44px] flex-1 rounded-lg px-2 py-2.5 text-sm font-bold transition-colors sm:px-3",
            active === tab.id
              ? "bg-surface-elevated text-brand shadow-sm"
              : "text-text-muted hover:text-text-main"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
