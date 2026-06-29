"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Copy, ExternalLink, Smartphone } from "lucide-react";

type DeviceKind = "ios" | "android" | "desktop";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectDevice(): DeviceKind {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function MobileInstallPanel() {
  const [appUrl, setAppUrl] = useState("");
  const [device, setDevice] = useState<DeviceKind>("desktop");
  const [installed, setInstalled] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setAppUrl(window.location.origin);
    setDevice(detectDevice());
    setInstalled(isStandalone());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const instructions = useMemo(() => {
    if (device === "ios") {
      return [
        "เปิดลิงก์นี้ใน Safari",
        "กดปุ่ม แชร์ (ไอคอนลูกศร)",
        "เลือก 「เพิ่มไปที่หน้าจอโฮม」",
        "เปิดจากไอคอนบนหน้าจอ — ใช้ได้เต็มจอเหมือนแอป",
      ];
    }
    if (device === "android") {
      return [
        "เปิดลิงก์นี้ใน Chrome",
        installPrompt
          ? "กดปุ่ม 「ติดตั้งแอป」 ด้านล่าง"
          : "เมนู ⋮ → 「ติดตั้งแอป」 หรือ 「เพิ่มไปที่หน้าจอหลัก」",
        "เปิดจากไอคอนบนหน้าจอ — ใช้ได้เต็มจอเหมือนแอป",
      ];
    }
    return [
      "ส่งลิงก์นี้ไปมือถือ/แท็บเล็ต (LINE, SMS ได้)",
      "Android: Chrome → ติดตั้งแอป",
      "iPhone/iPad: Safari → เพิ่มไปที่หน้าจอโฮม",
    ];
  }, [device, installPrompt]);

  const copyLink = useCallback(async () => {
    if (!appUrl) return;
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopyMessage("คัดลอกลิงก์แล้ว — ส่งใน LINE ได้เลย");
    } catch {
      setCopyMessage("คัดลอกไม่สำเร็จ — กดค้างที่ลิงก์แล้วเลือกคัดลอก");
    }
    setTimeout(() => setCopyMessage(null), 3000);
  }, [appUrl]);

  const runInstall = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }, [installPrompt]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        ใช้บนมือถือ/แท็บเล็ตได้ — ติดตั้งเป็นแอป (PWA) ไม่ต้องลง Play Store / App Store
      </p>

      {installed ? (
        <p className="rounded-xl bg-success/10 px-4 py-3 text-sm font-bold text-success">
          ติดตั้งแอปแล้ว — เปิดจากไอคอนบนหน้าจอได้เลย
        </p>
      ) : null}

      <div className="rounded-xl border-2 border-border-default bg-surface-inset p-3">
        <p className="mb-1 text-xs font-semibold text-text-secondary">ลิงก์เปิดระบบ</p>
        <p className="break-all font-mono text-sm font-bold text-text-main">{appUrl || "..."}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" className="gap-2 font-bold" onClick={() => void copyLink()}>
          <Copy size={18} />
          คัดลอกลิงก์
        </Button>
        {appUrl ? (
          <Button
            type="button"
            variant="outline"
            className="gap-2 font-bold"
            onClick={() => window.open(appUrl, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink size={18} />
            เปิดลิงก์
          </Button>
        ) : null}
        {installPrompt && !installed ? (
          <Button type="button" variant="income" className="gap-2 font-bold" onClick={() => void runInstall()}>
            <Smartphone size={18} />
            ติดตั้งแอป
          </Button>
        ) : null}
      </div>

      {copyMessage ? <p className="text-sm font-bold text-brand">{copyMessage}</p> : null}

      <div>
        <p className="mb-2 text-sm font-bold text-text-main">วิธีติดตั้งบนมือถือ</p>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-text-secondary">
          {instructions.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <p className="text-xs text-text-muted">
        ส่งลิงก์ใน LINE ให้พนักงานกดเปิดได้ — แนะนำติดตั้งแอปครั้งแรก แล้วเปิดจากไอคอนทุกครั้ง
      </p>
    </div>
  );
}
