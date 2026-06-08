import { PAYMENT_METHODS } from "@/constants";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import type { AuditLog } from "@/types";

const FIELD_LABELS: Record<string, string> = {
  title: "ชื่อหัวใบ",
  amount: "ยอดรวม",
  paymentMethod: "ช่องทางชำระ",
  transactionDate: "วันที่รายการ",
  note: "หมายเหตุ",
  status: "สถานะ",
};

const STATUS_LABELS: Record<string, string> = {
  active: "ใช้งาน",
  void: "ยกเลิก",
};

function paymentLabel(value: unknown): string {
  const found = PAYMENT_METHODS.find((p) => p.value === value);
  return found?.label ?? String(value ?? "-");
}

function formatFieldValue(key: string, value: unknown): string {
  if (value == null || value === "") return "-";
  if (key === "amount") return formatCurrency(Number(value));
  if (key === "paymentMethod") return paymentLabel(value);
  if (key === "transactionDate") return formatDateShort(String(value));
  if (key === "status") return STATUS_LABELS[String(value)] ?? String(value);
  return String(value);
}

function formatChangeLine(key: string, oldVal: unknown, newVal: unknown): string {
  const label = FIELD_LABELS[key] ?? key;
  return `${label}: ${formatFieldValue(key, oldVal)} → ${formatFieldValue(key, newVal)}`;
}

function formatLineItemsSummary(lineItems: unknown): string[] {
  if (!Array.isArray(lineItems) || lineItems.length === 0) return [];
  return lineItems.map((raw, index) => {
    const item = raw as Record<string, unknown>;
    const qty = Number(item.quantity ?? 1);
    const unit = Number(item.unitPrice ?? item.lineAmount ?? 0);
    const lineAmount = Number(item.lineAmount ?? qty * unit);
    const title = String(item.title ?? "-");
    return `${index + 1}. ${title} — ${qty} × ${formatCurrency(unit)} = ${formatCurrency(lineAmount)}`;
  });
}

/** สรุปการเปลี่ยนแปลงจาก old_value / new_value สำหรับหน้าประวัติ */
export function describeAuditChanges(log: AuditLog): string[] {
  const oldV = log.oldValue ?? {};
  const newV = log.newValue ?? {};

  if (log.action === "create") {
    const lines: string[] = ["บันทึกรายการใหม่"];
    if (newV.title) lines.push(`ชื่อหัวใบ: ${newV.title}`);
    if (newV.amount != null) {
      lines.push(`ยอดรวม: ${formatCurrency(Number(newV.amount))}`);
    }
    lines.push(...formatLineItemsSummary(newV.lineItems));
    if (newV.paymentMethod) {
      lines.push(`ช่องทาง: ${paymentLabel(newV.paymentMethod)}`);
    }
    return lines;
  }

  if (log.action === "void") {
    return [
      "เปลี่ยนสถานะ: ใช้งาน → ยกเลิก",
      ...(newV.amount != null
        ? [`ยอดรวม: ${formatCurrency(Number(newV.amount))}`]
        : []),
      ...formatLineItemsSummary(newV.lineItems),
    ];
  }

  const keys = ["title", "amount", "paymentMethod", "transactionDate", "note"] as const;
  const lines = keys
    .filter((key) => oldV[key] !== newV[key])
    .map((key) => formatChangeLine(key, oldV[key], newV[key]));

  const oldLines = formatLineItemsSummary(oldV.lineItems);
  const newLines = formatLineItemsSummary(newV.lineItems);
  if (JSON.stringify(oldLines) !== JSON.stringify(newLines)) {
    lines.push("รายการย่อยมีการเปลี่ยนแปลง");
    lines.push(...newLines);
  }

  return lines.length > 0 ? lines : ["แก้ไขรายการ (ไม่มีฟิลด์ที่เปลี่ยนใน snapshot)"];
}
