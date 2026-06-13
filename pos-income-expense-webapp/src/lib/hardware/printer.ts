import { fetchOrganization } from "@/lib/api/client";
import { printExpenseVoucherOnImin } from "@/lib/hardware/iminExpenseVoucherPrint";
import {
  getConnectedIminPrinter,
  isLikelyIminDevice,
  loadIminPrinterScript,
} from "@/lib/hardware/iminPrinterClient";
import { printReceiptOnImin } from "@/lib/hardware/iminReceiptPrint";
import type { HardwareConfig, Receipt, Transaction } from "@/types";

export interface PrintReceiptOptions {
  copies?: number;
  openDrawer?: boolean;
  hardwareConfig?: HardwareConfig;
  shopName?: string;
  footer?: string;
  sellerName?: string;
  recorderName?: string;
  voucherNumber?: string;
  categoryNames?: Record<string, string>;
}

export interface PrintReceiptResult {
  success: boolean;
  message: string;
  fallback?: "browser";
  mode?: "direct" | "bridge" | "imin";
}

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

function successMessage(transaction: Transaction): string {
  return transaction.type === "expense"
    ? "พิมพ์ใบบันทึกรายจ่ายแล้ว (เครื่องพิมพ์ iMin)"
    : "พิมพ์ใบเสร็จแล้ว (เครื่องพิมพ์ iMin)";
}

async function printViaServerApi(
  transaction: Transaction,
  receipt: Receipt,
  options?: PrintReceiptOptions,
  hw?: HardwareConfig
): Promise<PrintReceiptResult> {
  const res = await fetch("/api/hardware/print", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transaction,
      receipt,
      openDrawer: options?.openDrawer ?? transaction.paymentMethod === "cash",
      hardwareConfig: options?.hardwareConfig ?? hw,
      shopName: options?.shopName,
      footer: options?.footer,
      sellerName: options?.sellerName,
      recorderName: options?.recorderName,
      voucherNumber: options?.voucherNumber,
      categoryNames: options?.categoryNames,
    }),
  });

  const json = (await res.json()) as {
    data?: { success: boolean; message: string; mode?: "direct" | "bridge" };
    error?: { code?: string; message?: string };
    fallback?: "browser";
  };

  if (!res.ok) {
    if (json.error?.code === "NOT_CONFIGURED" || json.fallback === "browser") {
      return {
        success: false,
        message: json.error?.message ?? "ยังไม่ได้ตั้งค่าเครื่องพิมพ์",
        fallback: "browser",
      };
    }
    return {
      success: false,
      message: json.error?.message ?? `พิมพ์ไม่สำเร็จ (${res.status})`,
    };
  }

  return {
    success: true,
    message: json.data?.message ?? "พิมพ์แล้ว",
    mode: json.data?.mode,
  };
}

async function printViaImin(
  transaction: Transaction,
  receipt: Receipt,
  options: PrintReceiptOptions | undefined,
  hw: HardwareConfig
): Promise<PrintReceiptResult> {
  await loadIminPrinterScript();
  const printer = await getConnectedIminPrinter(hw);

  if (transaction.type === "expense") {
    printExpenseVoucherOnImin(printer, {
      transaction,
      voucherNumber: options?.voucherNumber ?? receipt.receiptNumber,
      shopName: options?.shopName,
      footer: options?.footer,
      recorderName: options?.recorderName,
      categoryNames: options?.categoryNames,
    });
  } else {
    printReceiptOnImin(printer, {
      transaction,
      receipt,
      shopName: options?.shopName,
      footer: options?.footer,
      sellerName: options?.sellerName,
      openDrawer: options?.openDrawer ?? transaction.paymentMethod === "cash",
    });
  }

  return {
    success: true,
    message: successMessage(transaction),
    mode: "imin",
  };
}

export async function printReceipt(
  transaction: Transaction,
  receipt: Receipt,
  options?: PrintReceiptOptions
): Promise<PrintReceiptResult> {
  if (typeof window === "undefined") {
    return printViaServerApi(transaction, receipt, options);
  }

  try {
    const hw = await resolveHardwareConfig(options?.hardwareConfig);

    if (shouldTryImin(hw)) {
      try {
        return await printViaImin(transaction, receipt, options, hw);
      } catch (e) {
        const message = e instanceof Error ? e.message : "พิมพ์ผ่าน iMin ไม่สำเร็จ";
        if (hw.printerType === "imin") {
          return { success: false, message };
        }
      }
    }

    if (hw.printerType === "lan" || hw.printerType === "usb") {
      return printViaServerApi(transaction, receipt, options, hw);
    }

    return {
      success: false,
      message: "ยังไม่ได้ตั้งค่าเครื่องพิมพ์ — ไปที่ ตั้งค่า → อุปกรณ์ POS",
      fallback: "browser",
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "พิมพ์ไม่สำเร็จ",
    };
  }
}

export function buildEscPosPayload(transaction: Transaction, receipt: Receipt): Uint8Array {
  void transaction;
  void receipt;
  return new Uint8Array();
}
