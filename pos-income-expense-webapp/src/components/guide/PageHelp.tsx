import type { ReactNode } from "react";
import { Info } from "lucide-react";

interface PageHelpProps {
  title: string;
  children: ReactNode;
  variant?: "info" | "compare";
}

export function PageHelp({ title, children, variant = "info" }: PageHelpProps) {
  return (
    <div
      className={
        variant === "compare"
          ? "rounded-xl border-2 border-brand/25 bg-brand/5 px-4 py-3"
          : "rounded-xl border border-border-default bg-surface-inset px-4 py-3"
      }
    >
      <p className="flex items-center gap-2 text-sm font-bold text-text-main">
        <Info size={16} className="shrink-0 text-brand" />
        {title}
      </p>
      <div className="mt-2 text-sm leading-relaxed text-text-secondary">{children}</div>
    </div>
  );
}
