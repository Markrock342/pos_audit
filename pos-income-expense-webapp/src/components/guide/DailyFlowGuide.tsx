"use client";

import Link from "next/link";
import { DAILY_FLOW_STEPS } from "./dailyFlowSteps";

export function DailyFlowGuide() {
  return (
    <div className="space-y-4 text-base">
      <p className="font-bold text-text-main">ทุกวัน 3 ขั้น</p>

      <ol className="space-y-2">
        {DAILY_FLOW_STEPS.map((s) => (
          <li key={s.n} className="flex items-baseline gap-2">
            <span className="font-black text-brand">{s.n}.</span>
            <Link href={s.href} className="font-medium text-text-main hover:text-brand hover:underline">
              {s.text}
            </Link>
          </li>
        ))}
      </ol>

      <p className="rounded-lg bg-surface-inset px-3 py-2 text-sm text-text-secondary">
        เช้าใส่เงินทอน → กลางวันจดรายรับ-รายจ่าย → เย็นนับเงินแล้วกด{" "}
        <strong className="text-text-main">เคลียร์ลิ้นชัก</strong> (เอาเงินออกหมด) →
        พรุ่งนี้ใส่ทอนใหม่
      </p>

      <div className="space-y-1 border-t border-border-default pt-3 text-sm text-text-muted">
        <p>
          ต้นเดือน (ไม่ใช่ในลิ้นชัก) →{" "}
          <Link href="/settings" className="font-bold text-brand hover:underline">
            ตั้งค่าเงินเริ่มต้นเดือน
          </Link>
        </p>
        <p>
          ดูรวมทั้งเดือน →{" "}
          <Link href="/balance" className="font-bold text-brand hover:underline">
            สรุปเงินทั้งเดือน
          </Link>
        </p>
      </div>
    </div>
  );
}
