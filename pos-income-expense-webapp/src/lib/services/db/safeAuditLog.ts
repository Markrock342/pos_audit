import { createAuditLog, type CreateAuditLogInput } from "@/lib/services/db/auditLogs";

/** บันทึก audit แต่ไม่ให้ล้มทั้ง request — ข้อมูลหลักสำคัญกว่า */
export async function safeCreateAuditLog(input: CreateAuditLogInput): Promise<void> {
  try {
    await createAuditLog(input);
  } catch (err) {
    console.error("[audit] write failed (transaction saved):", err);
  }
}
