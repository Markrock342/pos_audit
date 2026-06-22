/**
 * Read-only smoke test — GET only, no data mutation.
 * Run: npm run test:readonly
 */
import { getBusinessToday, shiftBusinessDate } from "../lib/utils/businessDate";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

async function check(name: string, url: string) {
  try {
    const res = await fetch(`${BASE}${url}`, { redirect: "manual" });
    const ok =
      (res.status >= 200 && res.status < 400) || res.status === 307 || res.status === 308;
    let detail = `status=${res.status}`;
    const location = res.headers.get("location");
    if (location) detail += ` -> ${location}`;

    const ct = res.headers.get("content-type") ?? "";
    if (res.ok && ct.includes("json")) {
      const j = (await res.json()) as Record<string, unknown>;
      if (Array.isArray(j.data)) detail += ` rows=${j.data.length}`;
      if (typeof j.totalDeposited === "number") detail += ` deposited=${j.totalDeposited}`;
      if (typeof j.totalWithdrawn === "number") detail += ` withdrawn=${j.totalWithdrawn}`;
      if (j.businessToday) detail += ` biz=${j.businessToday}`;
      const ledger = j.ledger as { cash?: { closing?: number } } | undefined;
      if (ledger?.cash?.closing != null) detail += ` closing=${ledger.cash.closing}`;
    }

    console.log(`${ok ? "[PASS]" : "[FAIL]"} ${name} — ${detail}`);
    return ok;
  } catch (e) {
    console.log(`[FAIL] ${name} — ${e instanceof Error ? e.message : String(e)}`);
    return false;
  }
}

async function main() {
  const endDate = getBusinessToday();
  const startDate = shiftBusinessDate(endDate, -30);
  const range = `startDate=${startDate}&endDate=${endDate}`;

  console.log(`\n=== Read-only smoke test @ ${BASE} ===\n`);

  const tests = [
    ["Page /cash-count", "/cash-count"],
    ["Page /settings", "/settings"],
    ["Page /history", "/history"],
    ["Page /dashboard", "/dashboard"],
    ["Redirect /cash-count/withdrawals", "/cash-count/withdrawals"],
    ["GET /api/cash-count/page-data", "/api/cash-count/page-data"],
    ["GET /api/cash-deposits", `/api/cash-deposits?${range}`],
    ["GET /api/cash-withdrawals", `/api/cash-withdrawals?${range}`],
    ["GET /api/daily-close/today", "/api/daily-close/today"],
    ["GET /api/audit-logs", `/api/audit-logs?${range}`],
    ["GET /api/cash-counts", "/api/cash-counts?limit=5"],
    ["GET /api/transactions", "/api/transactions?status=active&limit=5"],
    ["GET /api/reports/dashboard", "/api/reports/dashboard"],
  ] as const;

  const results = await Promise.all(tests.map(([name, url]) => check(name, url)));
  const pass = results.filter(Boolean).length;
  console.log(`\n=== Summary: ${pass}/${results.length} passed ===\n`);
  process.exit(pass === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
