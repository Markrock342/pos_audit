import { fetchOrganization } from "@/lib/api/client";
import {
  getConnectedIminPrinter,
  isLikelyIminDevice,
  loadIminPrinterScript,
} from "@/lib/hardware/iminPrinterClient";
import {
  initThermalLayout,
  thermalCenterLines,
  thermalFinish,
  thermalRule,
} from "@/lib/hardware/iminThermalLayout";
import type { HardwareConfig } from "@/types";

export interface TestPrintResult {
  success: boolean;
  message: string;
}

async function resolveHardwareConfig(): Promise<HardwareConfig> {
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

async function printTestViaImin(hw: HardwareConfig): Promise<TestPrintResult> {
  await loadIminPrinterScript();
  const printer = await getConnectedIminPrinter(hw);
  const now = new Date().toLocaleString("th-TH", { hour12: false });

  initThermalLayout(printer);
  thermalCenterLines(printer, ["ทดสอบพิมพ์"], true, true);
  thermalCenterLines(printer, ["POS Test Print"]);
  thermalRule(printer);
  thermalCenterLines(printer, [now]);
  thermalCenterLines(printer, ["สำเร็จ — ใช้งานได้"]);
  thermalFinish(printer, false);

  return { success: true, message: "พิมพ์ทดสอบแล้ว (iMin)" };
}

async function printTestViaServer(hw: HardwareConfig): Promise<TestPrintResult> {
  const res = await fetch("/api/hardware/test-print", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hardwareConfig: hw }),
  });

  const json = (await res.json()) as {
    data?: { message: string };
    error?: { message?: string };
  };

  if (!res.ok) {
    return {
      success: false,
      message: json.error?.message ?? "พิมพ์ทดสอบไม่สำเร็จ",
    };
  }

  return {
    success: true,
    message: json.data?.message ?? "พิมพ์ทดสอบแล้ว",
  };
}

export async function printTestPage(): Promise<TestPrintResult> {
  if (typeof window === "undefined") {
    return { success: false, message: "ใช้ได้บนเบราว์เซอร์เท่านั้น" };
  }

  const hw = await resolveHardwareConfig();

  if (shouldTryImin(hw)) {
    try {
      return await printTestViaImin(hw);
    } catch (e) {
      if (hw.printerType === "imin") {
        return {
          success: false,
          message: e instanceof Error ? e.message : "พิมพ์ทดสอบผ่าน iMin ไม่สำเร็จ",
        };
      }
    }
  }

  if (hw.printerType === "lan" || hw.printerType === "usb" || hw.ip?.trim()) {
    return printTestViaServer(hw);
  }

  return {
    success: false,
    message: "ยังไม่ได้ตั้งค่าเครื่องพิมพ์ — ตรวจ IP ใน hardware_config",
  };
}
