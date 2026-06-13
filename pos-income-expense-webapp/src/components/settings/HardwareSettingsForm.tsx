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
  const [printerType, setPrinterType] = useState<HardwareConfig["printerType"]>("imin");
  const [iminConnectType, setIminConnectType] = useState<HardwareConfig["iminConnectType"]>("USB");
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
      setPrinterType(hw.printerType ?? "imin");
      setIminConnectType(hw.iminConnectType ?? "USB");
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
    iminConnectType: printerType === "imin" ? iminConnectType : undefined,
    ip: printerType === "lan" || printerType === "usb" ? ip.trim() || undefined : undefined,
    port: printerType === "lan" || printerType === "usb" ? 9100 : undefined,
    bridgeUrl:
      printerType === "lan" || printerType === "usb" ? bridgeUrl.trim() || undefined : undefined,
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

  const showLanFields = printerType === "lan" || printerType === "usb";

  return (
    <div className="space-y-4">
      <Select
        label="เครื่องพิมพ์ใบเสร็จ"
        options={[
          { value: "imin", label: "iMin 80 — เครื่องพิมพ์ในตัว (แนะนำ)" },
          { value: "none", label: "ยังไม่เชื่อมต่อ" },
          { value: "lan", label: "Thermal 80mm — LAN (พอร์ต 9100)" },
          { value: "usb", label: "Thermal 80mm — USB (ผ่าน Bridge)" },
        ]}
        value={printerType ?? "imin"}
        onChange={(e) => setPrinterType(e.target.value as HardwareConfig["printerType"])}
      />
      {printerType === "imin" && (
        <Select
          label="ชนิดการเชื่อมต่อ iMin"
          options={[
            { value: "USB", label: "USB — iMin 80 / Star Micronics (แนะนำ)" },
            { value: "SPI", label: "SPI — รุ่นเก่าบางรุ่น" },
            { value: "Bluetooth", label: "Bluetooth" },
          ]}
          value={iminConnectType ?? "USB"}
          onChange={(e) =>
            setIminConnectType(e.target.value as HardwareConfig["iminConnectType"])
          }
        />
      )}
      {showLanFields && (
        <>
          <Input
            label="IP เครื่องพิมพ์"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="192.168.1.100"
          />
          <Input
            label="URL Local Bridge"
            value={bridgeUrl}
            onChange={(e) => setBridgeUrl(e.target.value)}
            placeholder="http://192.168.1.10:9101"
          />
        </>
      )}
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
    </div>
  );
}
