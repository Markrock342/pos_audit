import { AppLayout } from "@/components/layout/AppLayout";
import { BalanceSummaryView } from "@/components/balance/BalanceSummaryView";

export default function BalancePage() {
  return (
    <AppLayout
      title="สรุปเงินทั้งเดือน"
      subtitle="เงินเริ่มต้นเดือน + รายรับ − รายจ่าย — ไม่ใช่ยอดในลิ้นชักวันนี้"
    >
      <div className="mx-auto max-w-4xl">
        <BalanceSummaryView />
      </div>
    </AppLayout>
  );
}
