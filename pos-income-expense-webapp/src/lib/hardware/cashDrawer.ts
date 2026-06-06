/**
 * Cash Drawer integration placeholder (RJ11 via printer kick port).
 *
 * Future implementation plan:
 * - Send pulse command through thermal printer RJ11 port
 * - Typical ESC/POS drawer kick: ESC p m t1 t2
 * - Requires Local Bridge or Electron for direct hardware access from browser
 *
 * Note: Web browsers cannot access USB/serial directly —
 * a local service bridge will be needed in production.
 */
export async function openCashDrawer(): Promise<{ success: boolean; message: string }> {
  console.info("[Hardware] openCashDrawer called (mock)");

  return {
    success: true,
    message: "Cash drawer integration not yet connected. Command simulated.",
  };
}

export function buildDrawerKickCommand(): Uint8Array {
  // ESC p m t1 t2 — standard drawer kick (pin 2, 50ms on, 50ms off)
  return new Uint8Array([0x1b, 0x70, 0x00, 0x32, 0x32]);
}
