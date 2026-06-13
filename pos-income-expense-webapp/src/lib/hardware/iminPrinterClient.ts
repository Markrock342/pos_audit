import type { HardwareConfig } from "@/types";
import type { IminConnectType, IminPrinterInstance } from "@/lib/hardware/iminPrinter.types";

const IMIN_SCRIPT_SRC = "/vendor/imin-printer.js";
const CONNECT_TIMEOUT_MS = 8000;

let scriptPromise: Promise<void> | null = null;
let printerInstance: IminPrinterInstance | null = null;
let connectPromise: Promise<IminPrinterInstance> | null = null;

function resolveConnectType(config?: HardwareConfig): IminConnectType {
  const t = config?.iminConnectType;
  if (t === "SPI" || t === "USB" || t === "Bluetooth") return t;
  return "USB";
}

export function isLikelyIminDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("imin") || ua.includes("android");
}

export function loadIminPrinterScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("iMin SDK ใช้ได้บนเครื่อง POS เท่านั้น"));
  }
  if (window.IminPrinter) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${IMIN_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("โหลด iMin SDK ไม่สำเร็จ")), {
        once: true,
      });
      if (window.IminPrinter) resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = IMIN_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("โหลด iMin SDK ไม่สำเร็จ"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

export async function getConnectedIminPrinter(
  config?: HardwareConfig
): Promise<IminPrinterInstance> {
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    await loadIminPrinterScript();
    const IminPrinter = window.IminPrinter;
    if (!IminPrinter) {
      throw new Error("ไม่พบ iMin Printer SDK — ติดตั้งแอปบนเครื่อง iMin แล้วเปิดจากหน้าจอหลัก");
    }

    if (!printerInstance) {
      const address = config?.bridgeUrl?.trim() || undefined;
      printerInstance = new IminPrinter(address);
    }

    const connected = await withTimeout(
      printerInstance.connect(),
      CONNECT_TIMEOUT_MS,
      "เชื่อมต่อบริการพิมพ์ iMin ไม่ได้ — ตรวจว่าเปิดจากเครื่อง iMin และบริการพิมพ์ทำงานอยู่"
    );

    if (!connected) {
      throw new Error("เชื่อมต่อเครื่องพิมพ์ iMin ไม่สำเร็จ");
    }

    const connectType = resolveConnectType(config);
    printerInstance.initPrinter(connectType);

    const status = await printerInstance.getPrinterStatus(connectType);
    const code = String(status.value);
    if (code === "-1" || code === "1") {
      const fallback = connectType === "USB" ? "SPI" : "USB";
      printerInstance.initPrinter(fallback);
      const retry = await printerInstance.getPrinterStatus(fallback);
      const retryCode = String(retry.value);
      if (retryCode === "-1" || retryCode === "1") {
        throw new Error("เครื่องพิมพ์ iMin ยังไม่พร้อม — ตรวจสอบกระดาษและสาย USB");
      }
    }

    return printerInstance;
  })().finally(() => {
    connectPromise = null;
  });

  return connectPromise;
}

export function resetIminPrinterSession(): void {
  printerInstance = null;
  connectPromise = null;
}
