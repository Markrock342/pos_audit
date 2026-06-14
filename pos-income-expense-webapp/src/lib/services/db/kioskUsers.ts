import type { KioskAccount } from "@/constants/kioskUsers";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";
import { getDb } from "@/lib/db/supabase";

function kioskUserEmail(account: KioskAccount): string {
  if (account.type === "dev") return "dev@internal.local";
  return `${account.username}@shop.local`;
}

function toUserRow(account: KioskAccount) {
  return {
    id: account.userId,
    organization_id: account.organizationId,
    name: account.displayName,
    email: kioskUserEmail(account),
    role: account.role,
    is_active: true,
  };
}

/** สร้าง/อัปเดตแถว users อัตโนมัติ — ไม่ต้อง seed มือทุกครั้งที่เพิ่มบัญชี kiosk */
export async function ensureKioskUser(account: KioskAccount): Promise<void> {
  const { error } = await getDb().from("users").upsert(toUserRow(account), { onConflict: "id" });
  if (error) throw error;
}

export async function ensureKioskUserById(userId: string): Promise<void> {
  const account = KIOSK_ACCOUNTS.find((a) => a.userId === userId);
  if (account) await ensureKioskUser(account);
}

export async function syncAllKioskUsers(): Promise<void> {
  const { error } = await getDb()
    .from("users")
    .upsert(KIOSK_ACCOUNTS.map(toUserRow), { onConflict: "id" });
  if (error) throw error;
}
