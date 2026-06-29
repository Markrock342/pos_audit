/**
 * Cash Drawer integration (RJ11 / RJ12 via printer DK kick port).
 */
import { fetchOrganization } from "@/lib/api/client";
import {
  getConnectedIminPrinter,
  isLikelyIminDevice,
  loadIminPrinterScript,
} from "@/lib/hardware/iminPrinterClient";
import type { HardwareConfig } from "@/types";

export type DrawerKickPin = "pin2" | "pin5";

export interface DrawerKickOptions {
  pin?: DrawerKickPin;
  onMs?: number;
  offMs?: number;
  hardwareConfig?: HardwareConfig;
  /** ไม่รอ hardware นานเกินไป — default 4s */
  timeoutMs?: number;
}

export const DRAWER_OPEN_TIMEOUT_MS = 4000;

async function resolveHardwareConfig(
  hardwareConfig?: HardwareConfig
): Promise<HardwareConfig> {
  if (hardwareConfig) return hardwareConfig;
  if (typeof window === "undefined") return {};
  try {
    const org = await fetchOrganization();
    return org.hardwareConfig ?? {};
  } catch {
    return {};
  }
}

function shouldTryImin(hw: HardwareConfig): boolean {
  if (hw.printerType === "imin") return true;
  if (hw.printerType === "lan" || hw.printerType === "usb") return false;
  return isLikelyIminDevice();
}

async function openDrawerViaImin(hw: HardwareConfig): Promise<{ success: boolean; message: string }> {
  await loadIminPrinterScript();
  const printer = await getConnectedIminPrinter(hw);
  printer.openCashBox();
  return { success: true, message: "เปิดลิ้นชักแล้ว (iMin)" };
}

async function openCashDrawerOnce(
  options?: DrawerKickOptions
): Promise<{ success: boolean; message: string }> {
  const hw = await resolveHardwareConfig(options?.hardwareConfig);

  if (typeof window !== "undefined" && shouldTryImin(hw)) {
    try {
      return await openDrawerViaImin(hw);
    } catch (e) {
      if (hw.printerType === "imin") {
        return {
          success: false,
          message: e instanceof Error ? e.message : "เปิดลิ้นชักผ่าน iMin ไม่สำเร็จ",
        };
      }
    }
  }

  const timeoutMs = options?.timeoutMs ?? DRAWER_OPEN_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("/api/hardware/drawer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        pin: options?.pin,
        hardwareConfig: options?.hardwareConfig ?? hw,
      }),
    });

    const json = (await res.json()) as {
      data?: { message: string };
      error?: { message?: string };
    };

    if (!res.ok) {
      return {
        success: false,
        message: json.error?.message ?? "เปิดลิ้นชักไม่สำเร็จ",
      };
    }

    return {
      success: true,
      message: json.data?.message ?? "ส่งคำสั่งเปิดลิ้นชักแล้ว",
    };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return {
        success: false,
        message: "เปิดลิ้นชักใช้เวลานาน — เปิดด้วยมือแล้วนับเงิน",
      };
    }
    return {
      success: false,
      message: e instanceof Error ? e.message : "เปิดลิ้นชักไม่สำเร็จ",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function openCashDrawer(
  options?: DrawerKickOptions
): Promise<{ success: boolean; message: string }> {
  const timeoutMs = options?.timeoutMs ?? DRAWER_OPEN_TIMEOUT_MS;
  try {
    return await Promise.race([
      openCashDrawerOnce(options),
      new Promise<{ success: boolean; message: string }>((resolve) => {
        setTimeout(
          () =>
            resolve({
              success: false,
              message: "เปิดลิ้นชักใช้เวลานาน — เปิดด้วยมือแล้วนับเงิน",
            }),
          timeoutMs
        );
      }),
    ]);
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "เปิดลิ้นชักไม่สำเร็จ",
    };
  }
}

function msToEscPosUnit(ms: number): number {
  return Math.min(255, Math.max(1, Math.round(ms / 2)));
}

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
