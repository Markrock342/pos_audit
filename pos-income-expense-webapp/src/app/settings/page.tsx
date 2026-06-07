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
            <CardTitle>อุปกรณ์ POS (เตรียมไว้)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="เครื่องพิมพ์ใบเสร็จ"
              options={[
                { value: "none", label: "ยังไม่เชื่อมต่อ" },
                { value: "lan", label: "Thermal 80mm — LAN (แนะนำ tablet)" },
                { value: "usb", label: "Thermal 80mm — USB (ผ่าน Bridge)" },
              ]}
              defaultValue="none"
            />
            <Input label="IP เครื่องพิมพ์" placeholder="192.168.1.100" />
            <Input label="URL Local Bridge" placeholder="http://192.168.1.10:9101" />
            <Select
              label="ลิ้นชักเก็บเงิน (ต่อช่อง DK ที่เครื่องพิมพ์)"
              options={[
                { value: "none", label: "ยังไม่เชื่อมต่อ" },
                { value: "rj11", label: "RJ11 — ผ่านเครื่องพิมพ์" },
                { value: "rj12", label: "RJ12 — ผ่านเครื่องพิมพ์" },
              ]}
              defaultValue="rj12"
            />
            <Select
              label="ขาเด้งลิ้นชัก (ESC/POS pin)"
              options={[
                { value: "pin2", label: "Pin 2 — ลองก่อน (มาตรฐาน)" },
                { value: "pin5", label: "Pin 5 — ถ้า Pin 2 ไม่เด้ง (RJ12 บางรุ่น)" },
              ]}
              defaultValue="pin2"
            />
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline">
                ทดสอบพิมพ์
              </Button>
              <Button type="button" variant="outline">
                ทดสอบลิ้นชัก
              </Button>
            </div>
            <p className="text-xs text-text-muted">
              Tablet ใช้ PWA (ติดตั้งลง Home) — ลิ้นชัก RJ12 ต่อที่เครื่องพิมพ์ ไม่ต่อ tablet โดยตรง.
              ดู docs/hardware-plan.md
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
                { value: "supabase", label: "Supabase (ปัจจุบัน)" },
                { value: "mock", label: "Mock Data (ทดสอบ offline)" },
              ]}
              defaultValue="supabase"
            />
            <p className="text-xs text-text-muted">
              ตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY ใน .env.local
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
