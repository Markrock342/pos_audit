import Link from "next/link";

type CloseEditModeBannerContext = "transactions" | "pos-cash" | "cash-count";

interface CloseEditModeBannerProps {
  context?: CloseEditModeBannerContext;
}

/** แจ้งเตือนเดียวที่แสดงเมื่อเปิดแก้ไขปิดยอด */
export function CloseEditModeBanner({ context = "transactions" }: CloseEditModeBannerProps) {
  if (context === "pos-cash") {
    return (
      <p className="shrink-0 rounded-xl border-2 border-amber-400/60 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-800 dark:text-amber-200">
        เปิดแก้ไขปิดยอดแล้ว — ฝาก/ถอนได้ · ปิดยอดใหม่ที่{" "}
        <Link href="/cash-count" className="underline">
          สรุปปิดยอด
        </Link>
      </p>
    );
  }

  if (context === "cash-count") {
    return (
      <p className="shrink-0 rounded-xl border-2 border-amber-400/60 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-800 dark:text-amber-200">
        เปิดแก้ไขปิดยอดแล้ว — แก้ไขรายการได้ · ฝาก/ถอนที่{" "}
        <Link href="/pos-cash" className="underline">
          เงินสดใน POS
        </Link>
        {" · กดปิดยอดใหม่เมื่อเสร็จ"}
      </p>
    );
  }

  return (
    <p className="shrink-0 rounded-xl border-2 border-amber-400/60 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-800 dark:text-amber-200">
      เปิดแก้ไขปิดยอดแล้ว — แก้ไขรายรับ/รายจ่ายได้ · ฝาก/ถอนที่{" "}
      <Link href="/pos-cash" className="underline">
        เงินสดใน POS
      </Link>
      {" · ปิดยอดใหม่ที่ "}
      <Link href="/cash-count" className="underline">
        สรุปปิดยอด
      </Link>
    </p>
  );
}
