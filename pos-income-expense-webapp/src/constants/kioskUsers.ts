import type { UserRole } from "@/types";
import { ORG_IDS } from "./organizations";

export type KioskAccountType = "customer" | "dev";

export interface KioskAccount {
  type: KioskAccountType;
  username: string;
  pin: string;
  displayName: string;
  organizationId: string;
  userId: string;
  role: UserRole;
  /** ไม่แสดงใน dropdown โปรไฟล์ที่บันทึก */
  hiddenFromProfiles: boolean;
}

/** บัญชีระบบ — ลูกค้า vs ทีม dev */
export const KIOSK_ACCOUNTS: KioskAccount[] = [
  {
    type: "customer",
    username: "peeraphat",
    pin: "0000",
    displayName: "พีระพัฒน์ (ร้าน)",
    organizationId: ORG_IDS.customer,
    userId: "33333333-3333-3333-3333-333333333334",
    role: "admin",
    hiddenFromProfiles: false,
  },
  {
    type: "customer",
    username: "lcs",
    pin: "0000",
    displayName: "ลูกค้า (ร้าน)",
    organizationId: ORG_IDS.customer,
    userId: "33333333-3333-3333-3333-333333333333",
    role: "admin",
    hiddenFromProfiles: true,
  },
  {
    type: "dev",
    username: "dev",
    pin: "9999",
    displayName: "ทีมพัฒนา",
    organizationId: ORG_IDS.dev,
    userId: "44444444-4444-4444-4444-444444444444",
    role: "admin",
    hiddenFromProfiles: true,
  },
];

export const KIOSK_SESSION_KEY = "kiosk-session";

export interface KioskSession {
  username: string;
  type: KioskAccountType;
  displayName: string;
  organizationId: string;
  userId: string;
  role: UserRole;
}

export function findKioskAccount(username: string, pin: string): KioskAccount | undefined {
  // Server-side: default PIN only (overrides are per-device in localStorage)
  const trimmed = username.trim();
  const account = KIOSK_ACCOUNTS.find((a) => a.username === trimmed);
  if (!account || account.pin !== pin) return undefined;
  return account;
}

export function isBuiltinUsername(username: string): boolean {
  return KIOSK_ACCOUNTS.some((a) => a.username === username.trim());
}

export function isHiddenFromProfiles(username: string): boolean {
  const account = KIOSK_ACCOUNTS.find((a) => a.username === username.trim());
  return account?.hiddenFromProfiles ?? false;
}

export function toKioskSession(account: KioskAccount): KioskSession {
  return {
    username: account.username,
    type: account.type,
    displayName: account.displayName,
    organizationId: account.organizationId,
    userId: account.userId,
    role: account.role,
  };
}
