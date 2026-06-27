import { AppLayout } from "@/components/layout/AppLayout";
import { ReportsView } from "@/components/reports/ReportsView";
import { loadTransactions } from "@/lib/data/loader";
import {
  getReportDefaultEndDate,
  getReportDefaultStartDate,
} from "@/lib/utils/reportDateRange";

export const revalidate = 0;

export default async function ReportsPage() {
  const transactions = await loadTransactions({
    startDate: getReportDefaultStartDate(),
    endDate: getReportDefaultEndDate(),
    status: "active",
  });

  return (
    <AppLayout title="รายงาน" subtitle="กราฟ / ส่งออก CSV">
      <ReportsView initialTransactions={transactions} />
    </AppLayout>
  );
}
