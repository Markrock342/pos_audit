/**
 * Cash Drawer integration (RJ11 / RJ12 via printer DK kick port).
 *
 * ลิ้นชักต่อเข้าช่อง Drawer Kick ที่เครื่องพิมพ์ thermal — ไม่ต่อตรงกับ tablet/PC
 * รองรับทั้ง RJ11 (6P4C) และ RJ12 (6P6C) ขึ้นกับรุ่นสาย/ลิ้นชัก
 *
 * ESC/POS: ESC p m t1 t2
 *   m = 0 → pin 2 (พบบ่อย)
 *   m = 1 → pin 5 (บางรุ่นลิ้นชัก RJ12 ใช้ขานี้)
 *
 * ต้องทดสอบกับอุปกรณ์จริงว่า pin ไหนเด้ง — ตั้งค่าได้ในหน้า Settings
 */

export type DrawerKickPin = "pin2" | "pin5";

export interface DrawerKickOptions {
  pin?: DrawerKickPin;
  /** Pulse on time (ms), ESC/POS uses 2ms units — default 50ms = 0x32 */
  onMs?: number;
  /** Pulse off time (ms) */
  offMs?: number;
}

export async function openCashDrawer(
  options?: DrawerKickOptions
): Promise<{ success: boolean; message: string }> {
  const pin = options?.pin ?? "pin2";
  console.info("[Hardware] openCashDrawer called (mock)", { pin });

  return {
    success: true,
    message: `Cash drawer kick simulated (pin: ${pin}). Connect Local Bridge for real hardware.`,
  };
}

/** Convert ms to ESC/POS time unit (2ms per unit), clamp 1–255 */
function msToEscPosUnit(ms: number): number {
  return Math.min(255, Math.max(1, Math.round(ms / 2)));
}

/**
 * Build ESC/POS drawer kick bytes: ESC p m t1 t2
 * @see docs/hardware-plan.md
 */
export function buildDrawerKickCommand(options?: DrawerKickOptions): Uint8Array {
  const pinByte = options?.pin === "pin5" ? 0x01 : 0x00;
  const t1 = msToEscPosUnit(options?.onMs ?? 50);
  const t2 = msToEscPosUnit(options?.offMs ?? 50);

  return new Uint8Array([0x1b, 0x70, pinByte, t1, t2]);
}

export const DRAWER_KICK_PIN_OPTIONS: { value: DrawerKickPin; label: string }[] = [
  { value: "pin2", label: "Pin 2 (มาตรฐาน — ลองก่อน)" },
  { value: "pin5", label: "Pin 5 (บางลิ้นชัก RJ12)" },
];
