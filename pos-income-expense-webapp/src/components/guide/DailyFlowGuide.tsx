"use client";

import Link from "next/link";

const STEPS = [
  { n: 1, text: "เช้า — ใส่ยอดเงินทอน", href: "/cash-count" },
  { n: 2, text: "วัน — บันทึกรายรับ / รายจ่าย (ลิ้นชักเด้ง)", href: "/income/add" },
  { n: 3, text: "เย็น — นับเงินที่นับได้ทั้งหมด", href: "/cash-count" },
] as const;

export function DailyFlowGuide() {
  return (
    <div className="space-y-4 text-base">
      <p className="font-bold text-text-main">ทุกวัน 3 ขั้น</p>

      <ol className="space-y-2">
        {STEPS.map((s) => (
          <li key={s.n} className="flex items-baseline gap-2">
            <span className="font-black text-brand">{s.n}.</span>
            <Link href={s.href} className="font-medium text-text-main hover:text-brand hover:underline">
              {s.text}
            </Link>
          </li>
        ))}
      </ol>

      <p className="rounded-lg bg-surface-inset px-3 py-2 text-sm text-text-secondary">
        ยอดเงินทอน + รายรับ(สด) − รายจ่าย(สด) = ยอดเงินคงเหลือ → เทียบกับที่นับได้ = เงินขาด/เงินเกิน
      </p>

      <div className="space-y-1 border-t border-border-default pt-3 text-sm text-text-muted">
        <p>
          ต้นเดือน →{" "}
          <Link href="/settings" className="font-bold text-brand hover:underline">
            ตั้งค่ายอดยกมา
          </Link>
        </p>
        <p>
          ดูรวมเดือน →{" "}
          <Link href="/balance" className="font-bold text-brand hover:underline">
            ยอดคงเหลือ
          </Link>
        </p>
      </div>
    </div>
  );
}
