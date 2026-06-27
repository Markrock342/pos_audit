import { getDb } from "@/lib/db/supabase";
import { getBusinessToday } from "@/lib/utils/businessDate";

export type ClearBusinessDayResult = {
  cleared: boolean;
  countDate: string;
  transactions: number;
  cashDeposits: number;
  cashWithdrawals: number;
  closeEvents: number;
  cashCounts: number;
};

export async function clearBusinessDay(
  organizationId: string,
  countDate?: string
): Promise<ClearBusinessDayResult> {
  const businessToday = getBusinessToday();
  const targetDate = countDate ?? businessToday;

  if (targetDate !== businessToday) {
    throw new Error(`ล้างข้อมูลได้เฉพาะวันนี้ (${businessToday})`);
  }

  const { data, error } = await getDb().rpc("fn_admin_clear_business_day", {
    p_organization_id: organizationId,
    p_count_date: targetDate,
  });

  if (error) {
    if (
      error.message.includes("Could not find the function") ||
      error.message.includes("schema cache")
    ) {
      throw new Error(
        "ยังไม่ได้รัน SQL ล้างข้อมูลวันนี้ — รัน docs/supabase-admin-clear-business-day.sql ใน Supabase"
      );
    }
    throw new Error(error.message);
  }

  const payload = data as {
    cleared?: boolean;
    count_date?: string;
    transactions?: number;
    cash_deposits?: number;
    cash_withdrawals?: number;
    close_events?: number;
    cash_counts?: number;
  };

  return {
    cleared: !!payload.cleared,
    countDate: payload.count_date ?? targetDate,
    transactions: payload.transactions ?? 0,
    cashDeposits: payload.cash_deposits ?? 0,
    cashWithdrawals: payload.cash_withdrawals ?? 0,
    closeEvents: payload.close_events ?? 0,
    cashCounts: payload.cash_counts ?? 0,
  };
}
