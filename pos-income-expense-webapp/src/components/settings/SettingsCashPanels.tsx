"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { HardwareSettingsPanel } from "@/components/settings/HardwareSettingsPanel";

export function SettingsCashPanels() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ลิ้นชักและเครื่องพิมพ์</CardTitle>
        <p className="text-sm font-normal text-text-muted">
          เปิดลิ้นชัก · เปลี่ยนรหัส · ทดสอบพิมพ์ — ฝาก/ถอนเงินสดอยู่ที่หน้าปิดยอด
        </p>
      </CardHeader>
      <CardContent>
        <HardwareSettingsPanel />
      </CardContent>
    </Card>
  );
}
