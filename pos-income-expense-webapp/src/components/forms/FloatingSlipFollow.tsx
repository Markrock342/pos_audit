"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface FloatingSlipFollowProps {
  children: ReactNode;
  className?: string;
}

/**
 * ใบสลิปติดตาม scroll ในคอลัมน์ซ้าย (lg+)
 * ใช้ CSS sticky ภายใน grid row — สูงเท่าคอลัมน์ขวา จึงลอยได้ตลอดที่เลื่อนฟอร์ม
 */
export function FloatingSlipFollow({ children, className }: FloatingSlipFollowProps) {
  return (
    <div
      className={cn(
        "pos-kiosk-slip-sticky relative w-full max-w-[240px] lg:max-w-[260px] lg:self-stretch xl:max-w-[280px] 2xl:max-w-[320px]",
        className
      )}
    >
      <div
        className={cn(
          "draft-slip-follow w-full max-w-full",
          "lg:sticky lg:top-2 lg:z-25",
          "lg:max-h-[calc(100dvh-var(--app-header-h)-var(--app-main-py)-6rem-env(safe-area-inset-bottom,0px))]",
          "2xl:top-2 2xl:max-h-[calc(100dvh-var(--app-header-h)-2*var(--app-main-py)-2rem-env(safe-area-inset-bottom,0px))]",
          "lg:overflow-y-auto lg:shadow-[0_14px_40px_rgba(15,23,42,0.12)]"
        )}
      >
        {children}
      </div>
    </div>
  );
}
