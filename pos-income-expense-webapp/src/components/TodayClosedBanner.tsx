import Link from "next/link";

export function TodayClosedBanner() {
  return (
    <p className="shrink-0 rounded-xl bg-surface-inset px-4 py-3 text-sm text-text-secondary">
      วันนี้ปิดยอดแล้ว — ยอดรับ-จ่ายเคลียร์หมด · ดูสรุปวันนี้ได้ที่{" "}
      <Link href="/cash-count" className="font-bold text-brand underline-offset-2 hover:underline">
        สรุปปิดยอด → ประวัติ
      </Link>
    </p>
  );
}
