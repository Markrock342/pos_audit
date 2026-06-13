import type { ReactNode } from "react";

export const RECEIPT_LINE_CHARS = 42;

export function ReceiptShell({
  children,
  fullWidth,
}: {
  children: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`mx-auto bg-white px-4 py-5 font-mono text-[11px] leading-relaxed text-black ${
        fullWidth ? "w-full" : "w-[300px]"
      }`}
    >
      {children}
    </div>
  );
}

export function ReceiptHeader({
  shopName,
  subtitle,
}: {
  shopName: string;
  subtitle: string;
}) {
  return (
    <div className="border-b border-dashed border-gray-400 pb-3 text-center">
      <p className="text-[13px] font-bold leading-tight">{shopName}</p>
      <p className="mt-1 text-[10px] tracking-wide text-gray-600">{subtitle}</p>
    </div>
  );
}

export function ReceiptDivider({ char = "─" }: { char?: string }) {
  return (
    <div
      className="my-2.5 overflow-hidden whitespace-nowrap text-[10px] leading-none text-gray-400"
      aria-hidden
    >
      {char.repeat(RECEIPT_LINE_CHARS)}
    </div>
  );
}

export function ReceiptMetaRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px] ${
        bold ? "font-bold" : ""
      }`}
    >
      <span className="shrink-0 text-gray-700">{label}</span>
      <span className="min-w-0 text-right tabular-nums break-words">{value}</span>
    </div>
  );
}

export function ReceiptAmountRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 text-[11px] ${
        bold ? "text-[12px] font-bold" : ""
      }`}
    >
      <span className="shrink-0">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export function ReceiptLineItem({
  title,
  detail,
  amount,
  meta,
}: {
  title: string;
  detail: string;
  amount: string;
  meta?: string;
}) {
  return (
    <div className="space-y-0.5 border-b border-dotted border-gray-200 pb-2 last:border-0 last:pb-0">
      <p className="text-[11px] font-medium leading-snug">{title}</p>
      {meta && <p className="text-[10px] text-gray-600">{meta}</p>}
      <div className="flex items-baseline justify-between gap-2 text-[11px] tabular-nums">
        <span className="text-gray-700">{detail}</span>
        <span className="font-medium">{amount}</span>
      </div>
    </div>
  );
}

export function ReceiptFooter({ text }: { text: string }) {
  return (
    <p className="border-t border-dashed border-gray-400 pt-3 text-center text-[10px] leading-snug text-gray-600">
      {text}
    </p>
  );
}

export function ReceiptTotalsBlock({ children }: { children: ReactNode }) {
  return <div className="space-y-1 rounded-sm bg-gray-50 px-2 py-2">{children}</div>;
}
