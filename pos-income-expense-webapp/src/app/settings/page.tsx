import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DatabaseSettings } from "@/components/settings/DatabaseSettings";
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
            <CardTitle>อุปกรณ์ POS (เฟส 2)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary leading-relaxed">
              การตั้งค่าเครื่องพิมพ์ thermal และลิ้นชัก RJ12 จะเปิดใช้เมื่อติดตั้งอุปกรณ์จริง
              ตอนนี้ใช้ <strong>พิมพ์ใบเสร็จผ่านเครื่องพิมพ์ทั่วไป</strong> ได้ที่หน้ารายรับ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ฐานข้อมูล</CardTitle>
          </CardHeader>
          <CardContent>
            <DatabaseSettings />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
