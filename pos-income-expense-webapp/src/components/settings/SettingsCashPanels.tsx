"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CashMovementHistoryPanel } from "@/components/settings/CashMovementHistoryPanel";
import { HardwareSettingsPanel } from "@/components/settings/HardwareSettingsPanel";

export function SettingsCashPanels() {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (window.location.hash !== "#cash-movement-history") return;
    document.getElementById("cash-movement-history")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>ลิ้นชักและเครื่องพิมพ์</CardTitle>
          <p className="text-sm font-normal text-text-muted">
            ฝาก / ถอนเงินสด — ไม่นับเป็นรายรับ–รายจ่ายธุรกิจ
          </p>
        </CardHeader>
        <CardContent>
          <HardwareSettingsPanel onMovementSaved={() => setRefreshKey((k) => k + 1)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>ประวัติฝาก / ถอน</CardTitle>
          <p className="text-sm font-normal text-text-muted">
            บันทึกฝากและถอนเงินสด — แยกจากประวัติรายรับ–รายจ่าย
          </p>
        </CardHeader>
        <CardContent>
          <CashMovementHistoryPanel refreshKey={refreshKey} />
        </CardContent>
      </Card>
    </>
  );
}
