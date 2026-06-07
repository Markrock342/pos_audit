import { FileX, Plus } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionHref?: string;
  actionLabel?: string;
  actionVariant?: "brand" | "income";
}

export function EmptyState({
  title = "ยังไม่มีรายการ",
  message = "เริ่มต้นบันทึกรายการแรกของคุณ",
  actionHref,
  actionLabel = "+ เพิ่มรายการ",
  actionVariant = "brand",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-default bg-surface-elevated py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-inset">
        <FileX size={32} className="text-text-muted" />
      </div>
      <h3 className="mt-4 text-xl font-bold text-text-main">{title}</h3>
      <p className="mt-2 text-base text-text-secondary">{message}</p>
      {actionHref && (
        <Link
          href={actionHref}
          className={`mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-lg font-bold text-text-inverse shadow-md active:shadow-lg active:scale-95 transition-transform ${
            actionVariant === "income"
              ? "bg-income active:bg-income-hover shadow-[0_2px_8px_rgba(16,185,129,0.35)]"
              : "bg-brand active:bg-brand-hover"
          }`}
        >
          <Plus size={20} />
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
