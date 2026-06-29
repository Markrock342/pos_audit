import type { AuditLog, CashCountCloseEvent } from "@/types";
import type { CloseHistoryForDate } from "@/lib/services/db/closeEdit";

/** 1 รอบ = เปิดแก้ไขปิดยอด → แก้รายการ → ปิดยอดใหม่ */
export interface CloseEditRound {
  /** ลำดับที่แสดง (1, 2, 3…) */
  roundNumber: number;
  /** close_edit_generation ตอนเปิดแก้ไข */
  generation: number;
  reopenEvent: CashCountCloseEvent;
  closeAfterEvent?: CashCountCloseEvent;
  editAudits: AuditLog[];
  inProgress: boolean;
  editCount: number;
}

export function editsForGeneration(editAudits: AuditLog[], generation: number): AuditLog[] {
  return editAudits
    .filter((log) => (log.closeEditGeneration ?? 0) === generation)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/** ข้าม reopen_edit ซ้ำ (กดปุ่ม/ยิง API สองครั้งก่อนปิดรอบ) — ใช้รายการล่าสุดต่อ generation */
function isDuplicateReopenEdit(
  events: CashCountCloseEvent[],
  reopenIndex: number
): boolean {
  const reopen = events[reopenIndex];
  for (let j = reopenIndex - 1; j >= 0; j--) {
    const prev = events[j];
    if (prev.eventType === "close_after_edit") return false;
    if (prev.eventType !== "reopen_edit") continue;
    return prev.closeEditGeneration === reopen.closeEditGeneration;
  }
  return false;
}

/**
 * สร้างรายการรอบแก้ไขจากประวัติ
 * - ปิดยอดครั้งแรก (ไม่แก้ไข) → ไม่รวม
 * - เปิดแก้ไข + ปิดใหม่ = 1 รอบ (โชว์เมื่อมีรายการที่แก้ หรือกำลังแก้ไขอยู่)
 */
export function buildCloseEditRounds(history: CloseHistoryForDate): CloseEditRound[] {
  const sortedEvents = [...history.events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const rounds: CloseEditRound[] = [];
  let roundNumber = 0;

  for (let i = 0; i < sortedEvents.length; i++) {
    const reopen = sortedEvents[i];
    if (reopen.eventType !== "reopen_edit") continue;
    if (isDuplicateReopenEdit(sortedEvents, i)) continue;

    const generation = reopen.closeEditGeneration;
    const audits = editsForGeneration(history.editAudits, generation);

    const closeAfter = (() => {
      for (let j = i + 1; j < sortedEvents.length; j++) {
        const next = sortedEvents[j];
        if (next.eventType === "reopen_edit") break;
        if (next.eventType === "close_after_edit") return next;
      }
      return undefined;
    })();

    const inProgress =
      history.inEditMode &&
      history.currentGeneration === generation &&
      !closeAfter;

    if (!closeAfter && !inProgress) continue;
    if (closeAfter && audits.length === 0) continue;

    roundNumber += 1;
    rounds.push({
      roundNumber,
      generation,
      reopenEvent: reopen,
      closeAfterEvent: closeAfter,
      editAudits: audits,
      inProgress,
      editCount: audits.length,
    });
  }

  return rounds;
}

export function findCloseEditRound(
  history: CloseHistoryForDate,
  generation: number
): CloseEditRound | undefined {
  return buildCloseEditRounds(history).find((r) => r.generation === generation);
}
