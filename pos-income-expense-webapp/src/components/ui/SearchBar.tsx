"use client";

import { cn } from "@/lib/utils/cn";
import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  wrapperClassName?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "ค้นหารายการ...",
  wrapperClassName,
}: SearchBarProps) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <Search
        size={22}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border-2 border-border-default bg-surface-elevated py-4 pl-12 pr-4 text-lg text-text-main placeholder:text-text-muted focus:border-border-focus focus:outline-none focus:ring-4 focus:ring-brand-ring shadow-sm"
      />
    </div>
  );
}
