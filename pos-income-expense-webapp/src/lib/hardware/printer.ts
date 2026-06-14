import { fetchOrganization } from "@/lib/api/client";
import { openCashDrawer } from "@/lib/hardware/cashDrawer";
import { shouldOpenCashDrawer } from "@/lib/hardware/cashDrawerPolicy";
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
  address?: string;
  phone?: string;
  taxId?: string;
  /** ฉบับแก้ไข — ไม่เปิดลิ้นชัก + แสดง label บนใบ */
  isRevision?: boolean;
  revisedAt?: string;
  editReason?: string;
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

function successMessage(transaction: Transaction, isRevision?: boolean): string {
  const revised = isRevision ? "ฉบับแก้ไข" : "";
  return transaction.type === "expense"
    ? `พิมพ์ใบบันทึกรายจ่าย${revised}แล้ว`
    : `พิมพ์ใบเสร็จ${revised}แล้ว`;
}

function resolveOpenDrawer(transaction: Transaction, options?: PrintReceiptOptions): boolean {
  if (options?.isRevision) return false;
  if (options?.openDrawer !== undefined) return options.openDrawer;
  return shouldOpenCashDrawer(transaction);
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
      openDrawer: resolveOpenDrawer(transaction, options),
      hardwareConfig: options?.hardwareConfig ?? hw,
      shopName: options?.shopName,
      footer: options?.footer,
      sellerName: options?.sellerName,
      recorderName: options?.recorderName,
      voucherNumber: options?.voucherNumber,
      categoryNames: options?.categoryNames,
      isRevision: options?.isRevision,
      revisedAt: options?.revisedAt,
      editReason: options?.editReason,
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
    const openDrawer = resolveOpenDrawer(transaction, options);
    printExpenseVoucherOnImin(printer, {
      transaction,
      voucherNumber: options?.voucherNumber ?? receipt.receiptNumber,
      shopName: options?.shopName,
      footer: options?.footer,
      recorderName: options?.recorderName,
      categoryNames: options?.categoryNames,
      address: options?.address,
      phone: options?.phone,
      taxId: options?.taxId,
      openDrawer,
      isRevision: options?.isRevision,
      revisedAt: options?.revisedAt,
      editReason: options?.editReason,
    });
  } else {
    printReceiptOnImin(printer, {
      transaction,
      receipt,
      shopName: options?.shopName,
      footer: options?.footer,
      sellerName: options?.sellerName,
      address: options?.address,
      phone: options?.phone,
      taxId: options?.taxId,
      openDrawer: resolveOpenDrawer(transaction, options),
      isRevision: options?.isRevision,
      revisedAt: options?.revisedAt,
      editReason: options?.editReason,
    });
  }

  return {
    success: true,
    message: successMessage(transaction, options?.isRevision),
    mode: "imin",
  };
}

async function kickDrawerForExpenseCash(
  transaction: Transaction,
  openDrawer: boolean,
  hw: HardwareConfig
): Promise<void> {
  if (transaction.type !== "expense" || !openDrawer || transaction.paymentMethod !== "cash") return;
  await openCashDrawer({ hardwareConfig: hw }).catch(() => {});
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
        const openDrawer = resolveOpenDrawer(transaction, options);
        const result = await printViaImin(transaction, receipt, options, hw);
        if (result.success) await kickDrawerForExpenseCash(transaction, openDrawer, hw);
        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : "พิมพ์ผ่าน iMin ไม่สำเร็จ";
        if (hw.printerType === "imin") {
          return { success: false, message };
        }
      }
    }

    if (hw.printerType === "lan" || hw.printerType === "usb") {
      const openDrawer = resolveOpenDrawer(transaction, options);
      const result = await printViaServerApi(transaction, receipt, options, hw);
      if (result.success) await kickDrawerForExpenseCash(transaction, openDrawer, hw);
      return result;
    }

    return {
      success: false,
      message: "ยังไม่ได้ตั้งค่าเครื่องพิมพ์ — ตรวจการเชื่อมต่อ LAN/USB",
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
