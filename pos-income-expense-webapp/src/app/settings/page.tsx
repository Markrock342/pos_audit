import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoginPinSettingsPanel } from "@/components/settings/LoginPinSettingsPanel";
import { ClearTodayDataPanel } from "@/components/settings/ClearTodayDataPanel";
import { SettingsCashPanels } from "@/components/settings/SettingsCashPanels";
import { ShopSettingsForm } from "@/components/settings/ShopSettingsForm";

export default function SettingsPage() {
  return (
    <AppLayout title="ตั้งค่า" subtitle="ข้อมูลร้าน · PIN · ลิ้นชัก · เครื่องพิมพ์">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>PIN เข้าระบบ</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginPinSettingsPanel />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลร้าน</CardTitle>
          </CardHeader>
          <CardContent>
            <ShopSettingsForm />
          </CardContent>
        </Card>
        <SettingsCashPanels />
        <Card className="border-expense/20">
          <CardHeader>
            <CardTitle>ล้างข้อมูลวันนี้</CardTitle>
            <p className="text-sm font-normal text-text-muted">
              เริ่มวันใหม่ — ต้องใส่รหัสเปิดลิ้นชัก (0000 หรือที่ตั้งไว้)
            </p>
          </CardHeader>
          <CardContent>
            <ClearTodayDataPanel />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
