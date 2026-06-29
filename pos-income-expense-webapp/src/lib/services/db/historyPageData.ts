import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { getActivityLogs, getCashMovementActivityLogs } from "@/lib/services/db/auditLogs";
import { getCashCountsInRange } from "@/lib/services/db/cashCounts";
import { getCloseEventsInRange } from "@/lib/services/db/closeEdit";
import { buildPosDaySummaries } from "@/lib/utils/historyPosSummaries";
import { dedupeCloseEventsForDisplay } from "@/lib/utils/closeEventDisplay";
import type { AuditLog, AuditLogAction, CashCount, CashCountCloseEvent } from "@/types";

export type HistoryPageTab = "income" | "expense" | "pos" | "close";

export type HistoryPageData =
  | { tab: "income" | "expense"; auditLogs: AuditLog[] }
  | { tab: "pos"; posDays: ReturnType<typeof buildPosDaySummaries> }
  | { tab: "close"; closeEvents: CashCountCloseEvent[]; closeRows: CashCount[] };

function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  if (startDate && date < startDate) return false;
  if (endDate && date > endDate) return false;
  return true;
}

export async function loadHistoryPageData(
  tab: HistoryPageTab,
  startDate: string,
  endDate: string,
  action?: AuditLogAction
): Promise<HistoryPageData> {
  if (tab === "close") {
    const events = await getCloseEventsInRange(DEFAULT_ORG_ID, startDate, endDate);
    const closes = dedupeCloseEventsForDisplay(events);
    if (closes.length > 0) {
      return { tab: "close", closeEvents: closes, closeRows: [] };
    }
    const rows = await getCashCountsInRange(DEFAULT_ORG_ID, startDate, endDate);
    const filtered = rows
      .filter((row) => row.closedAt || row.hasManualCount || row.actualBalance > 0)
      .sort((a, b) => b.countDate.localeCompare(a.countDate));
    return { tab: "close", closeEvents: [], closeRows: filtered };
  }

  if (tab === "pos") {
    const [cashCounts, closeEvents, movements] = await Promise.all([
      getCashCountsInRange(DEFAULT_ORG_ID, startDate, endDate),
      getCloseEventsInRange(DEFAULT_ORG_ID, startDate, endDate),
      getCashMovementActivityLogs(DEFAULT_ORG_ID, { startDate, endDate }),
    ]);
    return {
      tab: "pos",
      posDays: buildPosDaySummaries(startDate, endDate, cashCounts, movements, closeEvents),
    };
  }

  const auditLogs = await getActivityLogs(DEFAULT_ORG_ID, {
    startDate,
    endDate,
    action,
    transactionType: tab,
  });

  return {
    tab,
    auditLogs: auditLogs
      .filter((log) => log.entityType === "transaction")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
