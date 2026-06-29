/**
 * History POS tab — ต้องไม่แสดง "ยังไม่ได้นับ" เมื่อมี close event แล้ว
 * Run: npx tsx src/scripts/history-pos-status-test.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

type Step = { name: string; pass: boolean; detail?: string };
const steps: Step[] = [];

function log(name: string, pass: boolean, detail?: string) {
  steps.push({ name, pass, detail });
  console.log(`[${pass ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function req(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60_000),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

function data<T>(json: unknown): T | null {
  if (json && typeof json === "object" && "data" in json) return (json as { data: T }).data;
  return null;
}

function errMsg(json: unknown): string {
  if (json && typeof json === "object" && "error" in json) {
    const e = (json as { error: { message?: string } }).error;
    return typeof e?.message === "string" ? e.message : JSON.stringify(e);
  }
  return "";
}

function isCloseSummary(eventType: string): boolean {
  return eventType === "close" || eventType === "close_after_edit";
}

function pickCloseEventForRound(
  events: Array<{ countDate: string; sessionRound?: number; eventType: string; actualBalance?: number }>,
  countDate: string,
  sessionRound: number
) {
  const candidates = events.filter(
    (e) =>
      isCloseSummary(e.eventType) &&
      e.countDate === countDate &&
      (e.sessionRound ?? 1) === sessionRound
  );
  if (candidates.length === 0) return undefined;
  return candidates.reduce((best, cur) => {
    const score = (t: string) => (t === "close_after_edit" ? 2 : t === "close" ? 1 : 0);
    return score(cur.eventType) > score(best.eventType) ? cur : best;
  });
}

/** mirrors history page buildPosDaySummaries pending logic */
function buildPosPending(
  closeEvent: { actualBalance?: number } | undefined,
  cashCount: { hasManualCount?: boolean; closedAt?: string | null } | null
): boolean {
  if (closeEvent) return false;
  if (!cashCount) return true;
  return !cashCount.hasManualCount && !cashCount.closedAt;
}

async function main() {
  console.log(`\n=== History POS Status Test @ ${BASE} ===\n`);

  let r = await req("GET", "/api/categories");
  if (r.status !== 200) {
    log("API reachable", false, String(r.status));
    process.exit(1);
  }
  const categories = data<Array<{ id: string; type: string }>>(r.json) ?? [];
  const incomeCat = categories.find((c) => c.type === "income");
  if (!incomeCat) {
    log("income category", false);
    process.exit(1);
  }

  await req("POST", "/api/admin/clear-today");

  r = await req("POST", "/api/transactions", {
    type: "income",
    title: "HIST-POS income",
    paymentMethod: "cash",
    lineItems: [{ title: "x", quantity: 1, unitPrice: 777, categoryId: incomeCat.id }],
  });
  log("seed income 777", r.status === 201, errMsg(r.json));

  r = await req("GET", "/api/cash-counts/today");
  const bizToday =
    (r.json as { businessToday?: string }).businessToday ??
    data<{ countDate?: string }>(r.json)?.countDate ??
    "";
  const expected = data<{ expectedBalance?: number }>(r.json)?.expectedBalance ?? 777;

  r = await req("POST", "/api/cash-counts/today/clear-drawer", { actualBalance: expected + 50 });
  log("close with overage +50", r.status === 200, errMsg(r.json));

  r = await req("GET", `/api/cash-counts/close-events?date=${bizToday}`);
  const events =
    data<{ events?: Array<{ countDate: string; sessionRound?: number; eventType: string; actualBalance?: number; variance?: number }> }>(
      r.json
    )?.events ??
    data<Array<{ countDate: string; sessionRound?: number; eventType: string; actualBalance?: number }>>(r.json) ??
    [];

  const round1Event = pickCloseEventForRound(events, bizToday, 1);
  log("close event exists for round 1", !!round1Event, round1Event?.eventType);

  r = await req("GET", "/api/cash-counts");
  const cashCounts = data<Array<{ countDate: string; hasManualCount?: boolean; closedAt?: string | null }>>(r.json) ?? [];
  const todayCount = cashCounts.find((c) => c.countDate === bizToday) ?? null;

  const pending = buildPosPending(round1Event, todayCount);
  log(
    "POS history card NOT pending after close",
    !pending && round1Event?.actualBalance != null,
    `pending=${pending} actual=${round1Event?.actualBalance ?? "null"} closedAt=${todayCount?.closedAt ?? "null"}`
  );

  // reopen + close again — still should not show pending for round 1
  r = await req("POST", "/api/cash-counts/today/reopen-for-edit", {});
  log("reopen for edit", r.status === 200, errMsg(r.json));

  r = await req("GET", "/api/cash-counts/today");
  const expected2 = data<{ expectedBalance?: number }>(r.json)?.expectedBalance ?? 0;
  r = await req("POST", "/api/cash-counts/today/clear-drawer", { actualBalance: expected2 });
  log("close after edit", r.status === 200, errMsg(r.json));

  r = await req("GET", `/api/cash-counts/close-events?date=${bizToday}`);
  const events2 =
    data<{ events?: Array<{ countDate: string; sessionRound?: number; eventType: string; actualBalance?: number }> }>(
      r.json
    )?.events ?? [];
  const round1AfterEdit = pickCloseEventForRound(events2, bizToday, 1);
  const pendingAfterEdit = buildPosPending(round1AfterEdit, todayCount);
  log(
    "round 1 still counted after close_after_edit",
    !pendingAfterEdit && round1AfterEdit?.eventType === "close_after_edit",
    `type=${round1AfterEdit?.eventType} actual=${round1AfterEdit?.actualBalance}`
  );

  r = await req("POST", "/api/cash-counts/today/start-new-round", {});
  log("start new round", r.status === 200, errMsg(r.json));

  r = await req("POST", "/api/transactions", {
    type: "income",
    title: "HIST-POS R2",
    paymentMethod: "cash",
    lineItems: [{ title: "x", quantity: 1, unitPrice: 100, categoryId: incomeCat.id }],
  });
  log("R2 income 100", r.status === 201, errMsg(r.json));

  r = await req("GET", "/api/cash-counts/today");
  const expectedR2 = data<{ expectedBalance?: number }>(r.json)?.expectedBalance ?? 100;
  r = await req("POST", "/api/cash-counts/today/clear-drawer", { actualBalance: expectedR2 });
  log("R2 close", r.status === 200, errMsg(r.json));

  r = await req("GET", `/api/cash-counts/close-events?date=${bizToday}`);
  const events3 =
    data<{ events?: Array<{ countDate: string; sessionRound?: number; eventType: string; actualBalance?: number }> }>(
      r.json
    )?.events ?? [];
  const round2Event = pickCloseEventForRound(events3, bizToday, 2);
  const pendingR2 = buildPosPending(round2Event, todayCount);
  log(
    "round 2 counted in history POS",
    !pendingR2 && round2Event != null,
    `actual=${round2Event?.actualBalance}`
  );

  const failed = steps.filter((s) => !s.pass).length;
  console.log(`\n=== ${steps.length - failed}/${steps.length} passed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
