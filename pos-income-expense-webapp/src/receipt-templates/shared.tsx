import type { ReactNode } from "react";
import {
  receiptRuleLine,
  receiptTotalRuleLine,
} from "@/lib/utils/receiptRule";

export {
  RECEIPT_RULE_WIDTH,
  RECEIPT_RULE_CHAR,
  RECEIPT_ITEM_COL,
  receiptRuleLine,
  receiptTotalRuleLine,
  formatReceiptMetaPair,
  formatReceiptItemRow,
  formatReceiptSummaryRow,
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
      className={`mx-auto bg-white px-2 py-3 font-mono text-[11px] leading-snug text-black ${
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
      <p className="text-[15px] font-bold leading-tight tracking-tight">{shopName}</p>
      <p className="mt-0.5 text-[10px] font-medium text-gray-700">{subtitle}</p>
      <ReceiptDivider />
    </div>
  );
}

/** เส้นคั่นเต็มความกว้าง — แบบ POS 80mm */
export function ReceiptDivider({ total }: { total?: boolean }) {
  return (
    <hr
      className={`my-1.5 w-full border-0 border-t border-black ${
        total ? "border-solid border-t-2" : "border-dashed"
      }`}
      aria-hidden
    />
  );
}

/** เส้นคั่นสำหรับพิมพ์ thermal (ตัวอักษร) */
export function ReceiptDividerPrint({ total }: { total?: boolean }) {
  return (
    <div
      className="my-1.5 overflow-hidden whitespace-nowrap text-[10px] leading-none text-black"
      aria-hidden
    >
      {total ? receiptTotalRuleLine() : receiptRuleLine()}
    </div>
  );
}

export function ReceiptMetaPair({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[11px] leading-snug">
      <span className="min-w-0 flex-1 break-words">{left}</span>
      <span className="shrink-0 max-w-[46%] text-right break-words tabular-nums">{right}</span>
    </div>
  );
}

export function ReceiptMetaSingle({ text }: { text: string }) {
  return <p className="text-[11px] leading-snug">{text}</p>;
}

export function ReceiptItemTableHeader() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_3.25rem_5.5rem] items-baseline gap-x-1 text-[10px] font-bold uppercase tracking-tight">
      <span>รายการ</span>
      <span className="text-center">จำนวน</span>
      <span className="text-right">รวม</span>
    </div>
  );
}

export function ReceiptItemTableRow({
  title,
  qty,
  amount,
  hint,
}: {
  title: string;
  qty: string | number;
  amount: string;
  /** บรรทัดเสริมเล็กน้อย เช่น หมวดหมู่ (รายจ่าย) — ไม่แสดงราคาต่อหน่วย */
  hint?: string;
}) {
  return (
    <div className="py-0.5">
      <div className="grid grid-cols-[minmax(0,1fr)_3.25rem_5.5rem] items-start gap-x-1 text-[11px]">
        <span className="leading-snug">{title}</span>
        <span className="text-center tabular-nums">{qty}</span>
        <span className="text-right tabular-nums">{amount}</span>
      </div>
      {hint && <p className="mt-0.5 text-[10px] text-gray-600">{hint}</p>}
    </div>
  );
}

export function ReceiptSummaryRow({
  label,
  value,
  bold,
  large,
}: {
  label: string;
  value: string;
  bold?: boolean;
  large?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 ${
        large ? "text-[13px] font-bold" : bold ? "text-[12px] font-bold" : "text-[11px]"
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
