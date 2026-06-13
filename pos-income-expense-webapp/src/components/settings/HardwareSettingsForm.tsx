"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { fetchOrganization, updateOrganizationApi } from "@/lib/api/client";
import { openCashDrawer } from "@/lib/hardware/cashDrawer";
import { printReceipt } from "@/lib/hardware/printer";
import type { HardwareConfig } from "@/types";

export function HardwareSettingsForm() {
  const [printerType, setPrinterType] = useState<HardwareConfig["printerType"]>("none");
  const [ip, setIp] = useState("");
  const [bridgeUrl, setBridgeUrl] = useState("");
  const [drawerType, setDrawerType] = useState<HardwareConfig["drawerType"]>("rj12");
  const [drawerPin, setDrawerPin] = useState<HardwareConfig["drawerPin"]>("pin2");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const org = await fetchOrganization();
      const hw = org.hardwareConfig ?? {};
      setPrinterType(hw.printerType ?? "none");
      setIp(hw.ip ?? "");
      setBridgeUrl(hw.bridgeUrl ?? "");
      setDrawerType(hw.drawerType ?? "rj12");
      setDrawerPin(hw.drawerPin ?? "pin2");
    } catch {
      setMessage("โหลดการตั้งค่าอุปกรณ์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const buildConfig = (): HardwareConfig => ({
    printerType,
    ip: ip.trim() || undefined,
    port: 9100,
    bridgeUrl: bridgeUrl.trim() || undefined,
    drawerType,
    drawerPin,
  });

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateOrganizationApi({ hardwareConfig: buildConfig() });
      setMessage("บันทึกการตั้งค่าอุปกรณ์แล้ว");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = async () => {
    const config = buildConfig();
    const result = await printReceipt(
      {
        id: "test",
        type: "income",
        categoryId: "",
        title: "ทดสอบพิมพ์",
        amount: 1,
        paymentMethod: "cash",
        transactionDate: new Date().toISOString().slice(0, 10),
        status: "active",
        isPrinted: false,
        createdBy: "",
        createdAt: new Date().toISOString(),
        lineItems: [
          {
            id: "test-line",
            transactionId: "test",
            sortOrder: 0,
            title: "รายการทดสอบ",
            quantity: 1,
            unitPrice: 1,
            lineAmount: 1,
            categoryId: "",
          },
        ],
      },
      { id: "test-receipt", transactionId: "test", receiptNumber: "TEST-001" },
      { hardwareConfig: config, openDrawer: false }
    );
    setMessage(result.message);
  };

  const handleTestDrawer = async () => {
    const result = await openCashDrawer({
      pin: drawerPin ?? "pin2",
      hardwareConfig: buildConfig(),
    });
    setMessage(result.message);
  };

  if (loading) {
    return <p className="text-sm text-text-muted">กำลังโหลด...</p>;
  }

  return (
    <div className="space-y-4">
      <Select
        label="เครื่องพิมพ์ใบเสร็จ"
        options={[
          { value: "none", label: "ยังไม่เชื่อมต่อ" },
          { value: "lan", label: "Thermal 80mm — LAN (แนะนำ tablet)" },
          { value: "usb", label: "Thermal 80mm — USB (ผ่าน Bridge)" },
        ]}
        value={printerType ?? "none"}
        onChange={(e) => setPrinterType(e.target.value as HardwareConfig["printerType"])}
      />
      <Input label="IP เครื่องพิมพ์" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.100" />
      <Input
        label="URL Local Bridge"
        value={bridgeUrl}
        onChange={(e) => setBridgeUrl(e.target.value)}
        placeholder="http://192.168.1.10:9101"
      />
      <Select
        label="ลิ้นชักเก็บเงิน"
        options={[
          { value: "none", label: "ยังไม่เชื่อมต่อ" },
          { value: "rj11", label: "RJ11 — ผ่านเครื่องพิมพ์" },
          { value: "rj12", label: "RJ12 — ผ่านเครื่องพิมพ์" },
        ]}
        value={drawerType ?? "rj12"}
        onChange={(e) => setDrawerType(e.target.value as HardwareConfig["drawerType"])}
      />
      <Select
        label="ขาเด้งลิ้นชัก (ESC/POS pin)"
        options={[
          { value: "pin2", label: "Pin 2 — ลองก่อน (มาตรฐาน)" },
          { value: "pin5", label: "Pin 5 — ถ้า Pin 2 ไม่เด้ง" },
        ]}
        value={drawerPin ?? "pin2"}
        onChange={(e) => setDrawerPin(e.target.value as HardwareConfig["drawerPin"])}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={handleTestPrint}>
          ทดสอบพิมพ์
        </Button>
        <Button type="button" variant="outline" onClick={handleTestDrawer}>
          ทดสอบลิ้นชัก
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </Button>
      </div>
      {message && <p className="text-xs text-text-secondary">{message}</p>}
      <p className="text-xs text-text-muted">
        1) ตั้ง IP เครื่องพิมพ์ (พอร์ต 9100) · 2) ถ้า deploy บน Vercel ให้รัน{" "}
        <code className="rounded bg-surface-inset px-1">npm run bridge</code> แล้วใส่ URL Bridge ·
        3) กดทดสอบพิมพ์
      </p>
    </div>
  );
}
