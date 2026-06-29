import { getCashCountByDate } from "@/lib/services/db/cashCounts";
import { getCashDeposits } from "@/lib/services/db/cashDeposits";
import { getCashWithdrawals } from "@/lib/services/db/cashWithdrawals";
import {
  isTodayWorkspaceClosedFromCashCount,
} from "@/lib/services/db/workspaceStatus";
import { isInCloseEditMode } from "@/lib/utils/closeEditUtils";
import { getBusinessToday } from "@/lib/utils/businessDate";
import type { CashDeposit, CashWithdrawal } from "@/types";

export type PosCashPagePayload = {
  businessToday: string;
  readOnly: boolean;
  dayCleared: boolean;
  inCloseEditMode: boolean;
  deposits: CashDeposit[];
  withdrawals: CashWithdrawal[];
  depositTotal: number;
  withdrawTotal: number;
};

function sumAmounts(rows: { amount: number }[]): number {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

/** โหลดหน้าเงินสดใน POS — query เบา 3 ชุด parallel (ไม่โหลด ledger/history ปิดยอด) */
export async function loadPosCashPageData(organizationId: string): Promise<PosCashPagePayload> {
  const businessToday = getBusinessToday();

  const cashCount = await getCashCountByDate(organizationId, businessToday);

  const inCloseEditMode = isInCloseEditMode(cashCount);
  const dayCleared = isTodayWorkspaceClosedFromCashCount(cashCount, businessToday);
  const sessionRound = dayCleared ? undefined : (cashCount?.sessionRound ?? 1);

  const [depositsRaw, withdrawalsRaw] = await Promise.all([
    getCashDeposits(organizationId, {
      depositDate: businessToday,
      ...(sessionRound != null ? { sessionRound } : {}),
    }),
    getCashWithdrawals(organizationId, {
      withdrawalDate: businessToday,
      ...(sessionRound != null ? { sessionRound } : {}),
    }),
  ]);

  const pastDay = !!cashCount && cashCount.countDate < businessToday;
  const readOnly =
    pastDay ||
    (!!cashCount?.closedAt && !cashCount.closeEditReopenedAt && !inCloseEditMode);

  return {
    businessToday,
    readOnly,
    dayCleared,
    inCloseEditMode,
    deposits: dayCleared ? [] : depositsRaw,
    withdrawals: dayCleared ? [] : withdrawalsRaw,
    depositTotal: dayCleared ? 0 : sumAmounts(depositsRaw),
    withdrawTotal: dayCleared ? 0 : sumAmounts(withdrawalsRaw),
  };
}
