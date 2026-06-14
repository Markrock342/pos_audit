/** รหัสเปิดลิ้นชัก — แยกจาก PIN login (เก็บในเครื่อง) */
export const DRAWER_PIN_STORAGE_KEY = "pos-drawer-pin";
export const DEFAULT_DRAWER_PIN = "0000";

export function getDrawerPin(): string {
  if (typeof window === "undefined") return DEFAULT_DRAWER_PIN;
  try {
    const stored = localStorage.getItem(DRAWER_PIN_STORAGE_KEY);
    if (stored && /^\d{4}$/.test(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_DRAWER_PIN;
}

export function setDrawerPin(pin: string): void {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error("รหัสต้องเป็นตัวเลข 4 หลัก");
  }
  localStorage.setItem(DRAWER_PIN_STORAGE_KEY, pin);
}

export function verifyDrawerPin(input: string): boolean {
  return input === getDrawerPin();
}
