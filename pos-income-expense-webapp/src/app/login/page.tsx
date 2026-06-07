import Link from "next/link";
import { APP_NAME, SHOP_NAME } from "@/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-base font-bold text-text-secondary tracking-wide">{SHOP_NAME}</p>
          <h1 className="mt-2 text-3xl font-bold text-text-main">{APP_NAME}</h1>
          <p className="mt-3 text-base text-text-secondary font-medium">เข้าสู่ระบบเพื่อจัดการรายรับ-รายจ่าย</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5">
              <Input
                label="อีเมล"
                type="email"
                placeholder="staff@coffeeshop.local"
                autoComplete="email"
              />
              <Input
                label="รหัสผ่าน"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <Link href="/dashboard" className="block">
                <Button type="button" size="lg" className="w-full text-xl font-bold">
                  เข้าสู่ระบบ (Mock)
                </Button>
              </Link>
            </form>
            <p className="mt-6 text-center text-sm text-text-muted font-medium">
              * ยังไม่มีระบบ Auth จริง — กดปุ่มเพื่อเข้า Dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
