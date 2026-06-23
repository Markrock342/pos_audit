"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DASHBOARD_REFRESH_EVENT } from "@/lib/api/client";

/** รีเฟรช dashboard เมื่อกลับมาเปิดแอป หรือหลังบันทึกรายการ */
export function DashboardLiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();

    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(DASHBOARD_REFRESH_EVENT, refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(DASHBOARD_REFRESH_EVENT, refresh);
    };
  }, [router]);

  return null;
}
