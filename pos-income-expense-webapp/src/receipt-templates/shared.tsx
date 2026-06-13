import type { ReactNode } from "react";
import { receiptRuleLine } from "@/lib/utils/receiptRule";

export {
  RECEIPT_RULE_WIDTH,
  RECEIPT_RULE_CHAR,
  RECEIPT_ITEM_COL,
  receiptRuleLine,
  formatReceiptMetaPair,
  formatReceiptItemRow,
  splitReceiptDateTime,
} from "@/lib/utils/receiptRule";

export function ReceiptShell({
  children,
  fullWidth,
}: {
  children: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`mx-auto bg-white px-3 py-4 font-mono text-[11px] leading-snug text-black ${
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
    <div className="text-center">
      <p className="text-[14px] font-bold leading-tight tracking-tight">{shopName}</p>
      <p className="mt-0.5 text-[10px] text-gray-700">{subtitle}</p>
      <ReceiptDivider />
    </div>
  );
}

export function ReceiptDivider() {
  return (
    <div
      className="my-2 overflow-hidden whitespace-nowrap text-[10px] leading-none text-black"
      aria-hidden
    >
      {receiptRuleLine()}
    </div>
  );
}

/** แถวข้อมูล 2 คอลัมน์ (เลขที่/วันที่ ซ้าย — ชื่อบิล/เวลา ขวา) */
export function ReceiptMetaPair({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-start justify-between gap-2 text-[11px] leading-snug">
      <span className="min-w-0 flex-1 break-words">{left}</span>
      <span className="shrink-0 max-w-[48%] text-right break-words tabular-nums">{right}</span>
    </div>
  );
}

export function ReceiptMetaSingle({ text }: { text: string }) {
  return <p className="text-[11px] leading-snug">{text}</p>;
}

export function ReceiptItemTableHeader() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_2rem_5.25rem] items-baseline gap-x-1 text-[10px] font-bold">
      <span>รายการ</span>
      <span className="text-center">จ.N</span>
      <span className="text-right">รวม</span>
    </div>
  );
}

export function ReceiptItemTableRow({
  title,
  qty,
  amount,
  subline,
}: {
  title: string;
  qty: string | number;
  amount: string;
  subline?: string;
}) {
  return (
    <div className="py-0.5">
      <div className="grid grid-cols-[minmax(0,1fr)_2rem_5.25rem] items-start gap-x-1 text-[11px]">
        <span className="leading-snug">{title}</span>
        <span className="text-center tabular-nums">{qty}</span>
        <span className="text-right tabular-nums">{amount}</span>
      </div>
      {subline && <p className="mt-0.5 pl-2 text-[10px] text-gray-600">{subline}</p>}
    </div>
  );
}

export function ReceiptSummaryRow({
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
      className={`flex items-baseline justify-between gap-2 text-[11px] ${
        bold ? "text-[12px] font-bold" : ""
      }`}
    >
      <span className="min-w-0">{label}</span>
      <span className="shrink-0 tabular-nums">{value}</span>
    </div>
  );
}

export function ReceiptFooter({ text }: { text: string }) {
  return (
    <div>
      <ReceiptDivider />
      <p className="pt-1 text-center text-[10px] leading-snug text-gray-700">{text}</p>
    </div>
  );
}
