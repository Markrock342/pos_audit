"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface DateTimeDisplayProps {
  iso: string;
  showRelative?: boolean;
  className?: string;
}

/** แสดงวันเวลา + relative time ที่อัปเดตทุก 30 วินาที */
export function DateTimeDisplay({
  iso,
  showRelative = true,
  className = "",
}: DateTimeDisplayProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={cn("block", className)}>
      <span className="block whitespace-nowrap font-medium">{formatDateTime(iso)}</span>
      {showRelative && (
        <span className="block text-xs text-text-muted">{formatRelativeTime(iso, now)}</span>
      )}
    </span>
  );
}
