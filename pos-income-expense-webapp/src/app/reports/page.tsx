import { AppLayout } from "@/components/layout/AppLayout";
import { ReportsView } from "@/components/reports/ReportsView";
import { loadTransactions } from "@/lib/data/loader";

function getFirstDayOfMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ReportsPage() {
  const transactions = await loadTransactions({
    startDate: getFirstDayOfMonth(),
    endDate: getToday(),
    status: "active",
  });

  return (
    <AppLayout title="รายงาน" subtitle="กราฟ / ส่งออก CSV">
      <ReportsView initialTransactions={transactions} />
    </AppLayout>
  );
}
