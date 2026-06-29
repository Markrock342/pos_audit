import { getAuditLogBusinessDate, getAuditLogSessionRound } from "@/lib/utils/auditLogDate";
import {
  isCloseSummaryEvent,
  pickCloseEventForRound,
} from "@/lib/utils/closeEventDisplay";
import { isCashCountPending } from "@/lib/utils/cashCountVariance";
import type { AuditLog, CashCount, CashCountCloseEvent } from "@/types";

export type PosDaySummary = {
  date: string;
  sessionRound: number;
  deposited: number;
  withdrawn: number;
  expectedBalance: number;
  actualBalance: number | null;
  variance: number | null;
  cashCount: CashCount | null;
  movements: AuditLog[];
};

function isDateInRange(date: string, startDate?: string, endDate?: string): boolean {
  if (startDate && date < startDate) return false;
  if (endDate && date > endDate) return false;
  return true;
}

function movementSessionRound(log: AuditLog): number {
  return getAuditLogSessionRound(log);
}

export function buildPosDaySummaries(
  start: string,
  end: string,
  cashCounts: CashCount[],
  movements: AuditLog[],
  closeEvents: CashCountCloseEvent[]
): PosDaySummary[] {
  const countByDate = new Map<string, CashCount>();
  for (const row of cashCounts) {
    if (isDateInRange(row.countDate, start, end)) {
      countByDate.set(row.countDate, row);
    }
  }

  const closes = closeEvents.filter(isCloseSummaryEvent);

  const roundKeys = new Set<string>();
  for (const event of closes) {
    roundKeys.add(`${event.countDate}:${event.sessionRound ?? 1}`);
  }
  for (const log of movements) {
    const date = getAuditLogBusinessDate(log);
    if (!isDateInRange(date, start, end)) continue;
    roundKeys.add(`${date}:${movementSessionRound(log)}`);
  }

  return [...roundKeys]
    .sort((a, b) => {
      const [dateA, roundA] = a.split(":");
      const [dateB, roundB] = b.split(":");
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return Number(roundB) - Number(roundA);
    })
    .map((key) => {
      const [date, roundStr] = key.split(":");
      const sessionRound = Number(roundStr);
      const cashCount = countByDate.get(date) ?? null;
      const closeEvent = pickCloseEventForRound(closes, date, sessionRound);
      const dayMovements = movements
        .filter((log) => {
          const logDate = getAuditLogBusinessDate(log);
          return logDate === date && movementSessionRound(log) === sessionRound;
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const deposited = dayMovements
        .filter((log) => log.entityType === "cash_deposit")
        .reduce((sum, log) => sum + Number(log.newValue?.amount ?? 0), 0);
      const withdrawn = dayMovements
        .filter((log) => log.entityType === "cash_withdrawal")
        .reduce((sum, log) => sum + Number(log.newValue?.amount ?? 0), 0);
      const pending = closeEvent ? false : cashCount ? isCashCountPending(cashCount) : true;

      return {
        date,
        sessionRound,
        deposited,
        withdrawn,
        expectedBalance: closeEvent?.expectedBalance ?? cashCount?.expectedBalance ?? 0,
        actualBalance:
          closeEvent?.actualBalance ??
          (pending || !cashCount ? null : cashCount.actualBalance),
        variance:
          closeEvent?.variance ?? (pending || !cashCount ? null : cashCount.variance),
        cashCount,
        movements: dayMovements,
      };
    });
}
