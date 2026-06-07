import type { Receipt, Transaction } from "@/types";

export interface PrintReceiptOptions {
  copies?: number;
  openDrawer?: boolean;
}

/**
 * Thermal Printer integration placeholder (80mm, ESC/POS).
 *
 * Future implementation plan:
 * - Send ESC/POS commands to thermal printer
 * - Support USB / LAN via Local Bridge (PWA on Android tablet)
 * - Cash drawer kick via printer DK port (RJ11/RJ12) after print
 * - Format receipt from template in /receipt-templates
 *
 * ESC/POS reference commands (examples):
 * - ESC @  : Initialize printer
 * - ESC d n: Feed n lines
 * - GS V   : Cut paper
 */
export async function printReceipt(
  transaction: Transaction,
  receipt: Receipt,
  options?: PrintReceiptOptions
): Promise<{ success: boolean; message: string }> {
  void options;
  console.info("[Hardware] printReceipt called (mock)", {
    transactionId: transaction.id,
    receiptNumber: receipt.receiptNumber,
  });

  return {
    success: true,
    message: "Printer integration not yet connected. Receipt queued for preview only.",
  };
}

export function buildEscPosPayload(transaction: Transaction, receipt: Receipt): Uint8Array {
  void transaction;
  void receipt;
  // TODO: build ESC/POS byte sequence for thermal printer
  return new Uint8Array();
}
