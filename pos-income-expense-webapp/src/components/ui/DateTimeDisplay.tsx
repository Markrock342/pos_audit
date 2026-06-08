"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/format";

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
    <div className={className}>
      <p className="whitespace-nowrap font-medium">{formatDateTime(iso)}</p>
      {showRelative && (
        <p className="text-xs text-text-muted">{formatRelativeTime(iso, now)}</p>
      )}
    </div>
  );
}
