import Link from "next/link";
import { APP_NAME, SHOP_NAME } from "@/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-sm font-medium text-amber-700">{SHOP_NAME}</p>
          <h1 className="mt-1 text-2xl font-bold text-stone-900">{APP_NAME}</h1>
          <p className="mt-2 text-sm text-stone-600">เข้าสู่ระบบเพื่อจัดการรายรับ-รายจ่าย</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
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
                <Button type="button" className="w-full">
                  เข้าสู่ระบบ (Mock)
                </Button>
              </Link>
            </form>
            <p className="mt-4 text-center text-xs text-stone-500">
              * ยังไม่มีระบบ Auth จริง — กดปุ่มเพื่อเข้า Dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
