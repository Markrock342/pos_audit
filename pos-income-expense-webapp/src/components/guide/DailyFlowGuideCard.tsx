import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DAILY_FLOW_STEPS } from "./DailyFlowGuide";
import { ListOrdered } from "lucide-react";

export function DailyFlowGuideCard() {
  return (
    <Card className="border border-brand/25 bg-brand/5">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="flex items-center gap-2 text-base font-black text-text-main">
          <ListOrdered size={18} className="shrink-0 text-brand" />
          วันนี้ทำอะไรบ้าง?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <ol className="space-y-2">
          {DAILY_FLOW_STEPS.map((s) => (
            <li key={s.n} className="flex items-baseline gap-2 text-sm">
              <span className="font-black text-brand">{s.n}.</span>
              <Link href={s.href} className="font-medium text-text-main hover:text-brand hover:underline">
                {s.text}
              </Link>
            </li>
          ))}
        </ol>
        <p className="border-t border-border-default pt-2 text-xs text-text-muted">
          สรุปทั้งเดือน →{" "}
          <Link href="/balance" className="font-bold text-brand hover:underline">
            สรุปเงินทั้งเดือน
          </Link>
          {" · "}
          เงินเริ่มต้นเดือน →{" "}
          <Link href="/settings" className="font-bold text-brand hover:underline">
            ตั้งค่า
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
