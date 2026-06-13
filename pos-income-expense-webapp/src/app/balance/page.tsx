import { AppLayout } from "@/components/layout/AppLayout";
import { BalanceSummaryView } from "@/components/balance/BalanceSummaryView";

export default function BalancePage() {
  return (
    <AppLayout title="ยอดคงเหลือ" subtitle="สรุปทั้งเดือน — เงินสด + โอน (ตามสมุด)">
      <div className="mx-auto max-w-4xl">
        <BalanceSummaryView />
      </div>
    </AppLayout>
  );
}
