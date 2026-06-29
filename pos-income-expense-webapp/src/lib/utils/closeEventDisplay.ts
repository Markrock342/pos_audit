import type { CashCountCloseEvent } from "@/types";

/** event ที่สรุปผลปิดยอดของแต่ละรอบ (ไม่รวม reopen / new_round) */
export function isCloseSummaryEvent(
  event: CashCountCloseEvent
): event is CashCountCloseEvent & { eventType: "close" | "close_after_edit" } {
  return event.eventType === "close" || event.eventType === "close_after_edit";
}

function closeEventPriority(eventType: CashCountCloseEvent["eventType"]): number {
  if (eventType === "close_after_edit") return 2;
  if (eventType === "close") return 1;
  return 0;
}

/** เลือก event ปิดยอดที่ควรแสดงต่อ 1 รอบ — หลังแก้ไขชนะปิดครั้งแรก */
export function pickCloseEventForRound(
  events: CashCountCloseEvent[],
  countDate: string,
  sessionRound: number
): CashCountCloseEvent | undefined {
  const round = sessionRound ?? 1;
  const candidates = events.filter(
    (event) =>
      isCloseSummaryEvent(event) &&
      event.countDate === countDate &&
      (event.sessionRound ?? 1) === round
  );

  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  return candidates.reduce((best, current) => {
    const bestPriority = closeEventPriority(best.eventType);
    const currentPriority = closeEventPriority(current.eventType);
    if (currentPriority > bestPriority) return current;
    if (currentPriority < bestPriority) return best;
    return current.createdAt > best.createdAt ? current : best;
  });
}

/**
 * 1 การ์ดต่อ 1 รอบปิดยอด — ถ้ามีทั้ง close และ close_after_edit ในรอบเดียวกัน
 * แสดงเฉพาะผลล่าสุด (หลังแก้ไข)
 */
export function dedupeCloseEventsForDisplay(
  events: CashCountCloseEvent[]
): CashCountCloseEvent[] {
  const closeEvents = events.filter(isCloseSummaryEvent);
  const roundKeys = new Set<string>();

  for (const event of closeEvents) {
    roundKeys.add(`${event.countDate}:${event.sessionRound ?? 1}`);
  }

  const deduped: CashCountCloseEvent[] = [];
  for (const key of roundKeys) {
    const [date, roundStr] = key.split(":");
    const picked = pickCloseEventForRound(closeEvents, date, Number(roundStr));
    if (picked) deduped.push(picked);
  }

  return deduped.sort((a, b) => {
    if (a.countDate !== b.countDate) return b.countDate.localeCompare(a.countDate);
    const roundDiff = (b.sessionRound ?? 1) - (a.sessionRound ?? 1);
    if (roundDiff !== 0) return roundDiff;
    return b.createdAt.localeCompare(a.createdAt);
  });
}
