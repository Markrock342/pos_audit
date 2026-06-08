import { PAYMENT_METHODS } from "@/constants";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import type { AuditLog } from "@/types";

const FIELD_LABELS: Record<string, string> = {
  title: "รายการ",
  amount: "จำนวนเงิน",
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

/** สรุปการเปลี่ยนแปลงจาก old_value / new_value สำหรับหน้าประวัติ */
export function describeAuditChanges(log: AuditLog): string[] {
  const oldV = log.oldValue ?? {};
  const newV = log.newValue ?? {};

  if (log.action === "create") {
    const lines: string[] = ["บันทึกรายการใหม่"];
    if (newV.title) lines.push(`รายการ: ${newV.title}`);
    if (newV.amount != null) {
      lines.push(`จำนวนเงิน: ${formatCurrency(Number(newV.amount))}`);
    }
    if (newV.paymentMethod) {
      lines.push(`ช่องทาง: ${paymentLabel(newV.paymentMethod)}`);
    }
    return lines;
  }

  if (log.action === "void") {
    return [
      "เปลี่ยนสถานะ: ใช้งาน → ยกเลิก",
      ...(newV.amount != null
        ? [`จำนวนเงิน: ${formatCurrency(Number(newV.amount))}`]
        : []),
    ];
  }

  const keys = ["title", "amount", "paymentMethod", "transactionDate", "note"] as const;
  const lines = keys
    .filter((key) => oldV[key] !== newV[key])
    .map((key) => formatChangeLine(key, oldV[key], newV[key]));

  return lines.length > 0 ? lines : ["แก้ไขรายการ (ไม่มีฟิลด์ที่เปลี่ยนใน snapshot)"];
}
