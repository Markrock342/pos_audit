import net from "node:net";
import type { HardwareConfig } from "@/types";

export interface SendPrintPayload {
  data: Uint8Array;
  host: string;
  port: number;
}

export async function sendRawToPrinter(
  { data, host, port }: SendPrintPayload,
  timeoutMs = 8000
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (err) reject(err);
      else resolve();
    };

    socket.setTimeout(timeoutMs);
    socket.on("timeout", () => finish(new Error("เชื่อมต่อเครื่องพิมพ์ timeout")));
    socket.on("error", (err) => finish(err));
    socket.connect(port, host, () => {
      socket.write(Buffer.from(data), (err) => {
        if (err) finish(err);
        else {
          socket.end();
          finish();
        }
      });
    });
  });
}

export async function sendViaBridge(
  bridgeUrl: string,
  payload: { host: string; port: number; data: Uint8Array }
): Promise<void> {
  const base = bridgeUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/print`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host: payload.host,
      port: payload.port,
      data: Buffer.from(payload.data).toString("base64"),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Bridge error ${res.status}`);
  }
}

export function resolvePrinterTarget(config: HardwareConfig): {
  host: string;
  port: number;
} | null {
  if (!config.ip?.trim() || config.printerType === "none") return null;
  return {
    host: config.ip.trim(),
    port: config.port ?? 9100,
  };
}

export async function dispatchPrintJob(
  config: HardwareConfig,
  data: Uint8Array
): Promise<{ mode: "direct" | "bridge" }> {
  const target = resolvePrinterTarget(config);
  if (!target) {
    throw new Error("ยังไม่ได้ตั้งค่า IP เครื่องพิมพ์ — ตรวจการเชื่อมต่อ LAN");
  }

  if (config.bridgeUrl?.trim()) {
    await sendViaBridge(config.bridgeUrl.trim(), { ...target, data });
    return { mode: "bridge" };
  }

  await sendRawToPrinter({ ...target, data });
  return { mode: "direct" };
}
