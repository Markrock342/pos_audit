import { KIOSK_ACCOUNTS, type KioskAccount } from "@/constants/kioskUsers";

export const KIOSK_PIN_OVERRIDES_KEY = "pos-kiosk-pin-overrides";

/** บัญชีลูกค้าที่เปลี่ยน PIN ได้จากหน้าตั้งค่า */
export function getLoginPinEditableAccounts(): KioskAccount[] {
  return KIOSK_ACCOUNTS.filter((a) => a.type === "customer" && !a.hiddenFromProfiles);
}

function readOverrides(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KIOSK_PIN_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && /^\d{4}$/.test(value)) {
        out[key] = value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function getEffectiveLoginPin(username: string, defaultPin: string): string {
  const trimmed = username.trim();
  return readOverrides()[trimmed] ?? defaultPin;
}

export function hasCustomLoginPin(username: string): boolean {
  const trimmed = username.trim();
  return trimmed in readOverrides();
}

export function setLoginPin(username: string, pin: string): void {
  const trimmed = username.trim();
  const account = KIOSK_ACCOUNTS.find((a) => a.username === trimmed);
  if (!account || account.hiddenFromProfiles) {
    throw new Error("ไม่สามารถเปลี่ยน PIN บัญชีนี้ได้");
  }
  if (!/^\d{4}$/.test(pin)) {
    throw new Error("PIN ต้องเป็นตัวเลข 4 หลัก");
  }
  const overrides = readOverrides();
  overrides[trimmed] = pin;
  localStorage.setItem(KIOSK_PIN_OVERRIDES_KEY, JSON.stringify(overrides));
}

export function resetLoginPin(username: string): void {
  const trimmed = username.trim();
  const overrides = readOverrides();
  delete overrides[trimmed];
  localStorage.setItem(KIOSK_PIN_OVERRIDES_KEY, JSON.stringify(overrides));
}

export function findKioskAccountWithPin(username: string, pin: string): KioskAccount | undefined {
  const trimmed = username.trim();
  const account = KIOSK_ACCOUNTS.find((a) => a.username === trimmed);
  if (!account) return undefined;
  const effective = getEffectiveLoginPin(trimmed, account.pin);
  return pin === effective ? account : undefined;
}
