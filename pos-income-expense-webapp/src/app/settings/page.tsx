import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SHOP_NAME } from "@/constants";

export default function SettingsPage() {
  return (
    <AppLayout title="ตั้งค่า">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลร้าน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="ชื่อร้าน" defaultValue={SHOP_NAME} />
            <Input label="ที่อยู่" placeholder="ที่อยู่ร้าน (สำหรับใบเสร็จ)" />
            <Input label="เบอร์โทร" placeholder="0xx-xxx-xxxx" />
            <Button type="button">บันทึกข้อมูลร้าน</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ฮาร์ดแวร์ (เตรียมไว้)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="เครื่องพิมพ์ใบเสร็จ"
              options={[
                { value: "none", label: "ยังไม่เชื่อมต่อ" },
                { value: "thermal-80", label: "Thermal 80mm (Mock)" },
              ]}
              defaultValue="none"
            />
            <Select
              label="ลิ้นชักเก็บเงิน"
              options={[
                { value: "none", label: "ยังไม่เชื่อมต่อ" },
                { value: "rj11", label: "RJ11 via Printer (Mock)" },
              ]}
              defaultValue="none"
            />
            <p className="text-xs text-text-muted">
              การเชื่อมต่อจริงจะพัฒนาใน /lib/hardware — ดู docs/hardware-plan.md
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ฐานข้อมูล (เตรียมไว้)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Database Provider"
              options={[
                { value: "mock", label: "Mock Data (ปัจจุบัน)" },
                { value: "firebase", label: "Firebase" },
                { value: "supabase", label: "Supabase" },
                { value: "postgres", label: "PostgreSQL" },
              ]}
              defaultValue="mock"
            />
            <p className="text-xs text-text-muted">
              ตั้งค่าจริงใน /lib/db เมื่อพร้อมเชื่อมต่อ
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
