import type { HardwareConfig, Receipt, Transaction } from "@/types";

export interface PrintReceiptOptions {
  copies?: number;
  openDrawer?: boolean;
  hardwareConfig?: HardwareConfig;
  shopName?: string;
  footer?: string;
  sellerName?: string;
}

export interface PrintReceiptResult {
  success: boolean;
  message: string;
  /** ใช้ window.print() แทนเมื่อไม่มีเครื่องพิมพ์ thermal */
  fallback?: "browser";
  mode?: "direct" | "bridge";
}

export async function printReceipt(
  transaction: Transaction,
  receipt: Receipt,
  options?: PrintReceiptOptions
): Promise<PrintReceiptResult> {
  try {
    const res = await fetch("/api/hardware/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction,
        receipt,
        openDrawer: options?.openDrawer ?? transaction.paymentMethod === "cash",
        hardwareConfig: options?.hardwareConfig,
        shopName: options?.shopName,
        footer: options?.footer,
        sellerName: options?.sellerName,
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
      message: json.data?.message ?? "พิมพ์ใบเสร็จแล้ว",
      mode: json.data?.mode,
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
