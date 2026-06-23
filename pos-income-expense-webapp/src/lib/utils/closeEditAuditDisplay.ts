import type { AuditLog } from "@/types";
import { formatCurrency, formatWithdrawalAmount } from "@/lib/utils/format";

const ACTION_LABEL: Record<AuditLog["action"], string> = {
  create: "เพิ่ม",
  update: "แก้ไข",
  void: "ยกเลิก",
};

export function closeEditAuditLabel(log: AuditLog): string {
  const action = ACTION_LABEL[log.action];

  if (log.entityType === "cash_deposit") {
    const amount = Number(log.newValue?.amount ?? 0);
    return `${action}ฝากเงินสด`;
  }

  if (log.entityType === "cash_withdrawal") {
    return `${action}ถอนเงินสด`;
  }

  if (log.entityType === "transaction") {
    const typeLabel = log.transactionType === "expense" ? "รายจ่าย" : "รายรับ";
    return `${action}${typeLabel}`;
  }

  return `${action}รายการ`;
}

export function closeEditAuditAmount(log: AuditLog): string | null {
  const raw = log.newValue?.amount ?? log.oldValue?.amount;
  if (raw == null) return null;
  const num = Number(raw);
  if (Number.isNaN(num)) return null;

  if (log.entityType === "cash_deposit") {
    return `+${formatCurrency(num)}`;
  }
  if (log.entityType === "cash_withdrawal") {
    return formatWithdrawalAmount(num);
  }
  if (log.transactionType === "expense") {
    return `-${formatCurrency(num)}`;
  }
  return `+${formatCurrency(num)}`;
}

export function partitionCloseEditAudits(audits: AuditLog[]): {
  cashMovement: AuditLog[];
  business: AuditLog[];
} {
  const cashMovement: AuditLog[] = [];
  const business: AuditLog[] = [];
  for (const log of audits) {
    if (log.entityType === "cash_deposit" || log.entityType === "cash_withdrawal") {
      cashMovement.push(log);
    } else if (log.entityType === "transaction") {
      business.push(log);
    }
  }
  return { cashMovement, business };
}

export function closeEditAuditActionLabel(log: AuditLog): string {
  return ACTION_LABEL[log.action];
}

/** ประเภทย่อย — ฝาก / ถอน / รายรับ / รายจ่าย */
export function closeEditAuditKind(log: AuditLog): string {
  if (log.entityType === "cash_deposit") return "ฝากเงินสด";
  if (log.entityType === "cash_withdrawal") return "ถอนเงินสด";
  if (log.transactionType === "expense") return "รายจ่าย";
  return "รายรับ";
}

/** ชื่อรายการหลัก (ไม่ซ้ำกับประเภท) */
export function closeEditAuditTitle(log: AuditLog): string {
  if (log.entityType === "cash_deposit") return "ฝากเงินสด";
  if (log.entityType === "cash_withdrawal") {
    const note = log.newValue?.note as string | undefined;
    return note?.trim() || log.entityTitle || "ถอนเงินสด";
  }
  return log.entityTitle?.trim() || "ไม่มีชื่อรายการ";
}
