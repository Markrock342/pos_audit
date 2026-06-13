import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { HardwareSettingsForm } from "@/components/settings/HardwareSettingsForm";
import { ShopSettingsForm } from "@/components/settings/ShopSettingsForm";

export default function SettingsPage() {
  return (
    <AppLayout title="ตั้งค่า" subtitle="ข้อมูลร้าน · ยอดยกมา">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลร้าน</CardTitle>
          </CardHeader>
          <CardContent>
            <ShopSettingsForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>อุปกรณ์ POS — เครื่องพิมพ์ / ลิ้นชัก</CardTitle>
          </CardHeader>
          <CardContent>
            <HardwareSettingsForm />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
