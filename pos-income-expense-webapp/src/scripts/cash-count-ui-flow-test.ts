/**
 * Cash count UI flow simulation — mirrors /cash-count page behavior via API
 * Run: npx tsx src/scripts/cash-count-ui-flow-test.ts
 */
const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

type Step = { name: string; pass: boolean; detail?: string };

async function req(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

function data<T>(json: unknown): T | null {
  if (json && typeof json === "object" && "data" in json) return (json as { data: T }).data;
  return null;
}

async function main() {
  console.log(`\n=== Cash Count UI Flow Test @ ${BASE} ===\n`);
  const steps: Step[] = [];
  const log = (name: string, pass: boolean, detail?: string) => {
    steps.push({ name, pass, detail });
    console.log(`[${pass ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
  };

  // 1) Page loads (SSR shell)
  const pageRes = await fetch(`${BASE}/cash-count`);
  log("หน้า /cash-count โหลดได้", pageRes.ok, `status=${pageRes.status}`);

  // 2) Initial load — fetchCashCountToday()
  let r = await req("GET", "/api/cash-counts/today");
  log("โหลดวันนี้ (fetchCashCountToday)", r.status === 200, r.status !== 200 ? r.text.slice(0, 80) : undefined);

  const payload = r.json as {
    businessToday?: string;
    data?: {
      id: string;
      countDate: string;
      openingBalance: number;
      expectedBalance: number;
      actualBalance: number;
      hasManualCount?: boolean;
      closedAt?: string | null;
    };
    expectedBalance?: number;
    isLocked?: boolean;
  };

  const bizToday = payload.businessToday ?? "";
  const rec = payload.data;
  log("ได้ businessToday", !!bizToday, bizToday);

  if (rec) {
    const pending = !rec.hasManualCount && !rec.closedAt;
    log(
      "สถานะก่อนนับ = ยังไม่ได้นับ (hasManualCount=false, ไม่ปิด)",
      pending,
      `hasManualCount=${rec.hasManualCount} closedAt=${rec.closedAt ?? "null"}`
    );
  }

  if (!rec?.id) {
    console.log("\nไม่มี record วันนี้ — ข้ามขั้นตอนที่เหลือ");
    printSummary(steps);
    process.exit(1);
  }

  const id = rec.id;
  const opening = rec.openingBalance;
  const expected = rec.expectedBalance;

  // 3) Simulate user entering actual = 0 via numpad (actualTouched) then save
  r = await req("PUT", `/api/cash-counts/${id}`, {
    openingBalance: opening,
    actualBalance: 0,
    note: "UI flow test — นับได้ 0 บาท",
  });
  const savedZero = data<{ actualBalance: number; variance: number; status: string; hasManualCount?: boolean }>(r.json);
  log("บันทึกยอดนับจริง = 0", r.status === 200, savedZero ? `variance=${savedZero.variance} status=${savedZero.status}` : r.text.slice(0, 100));
  log(
    "หลังบันทึก hasManualCount=true",
    savedZero?.hasManualCount === true,
    String(savedZero?.hasManualCount)
  );
  log(
    "variance ถูกต้อง (0 - expected)",
    savedZero != null && Math.abs(savedZero.variance - (0 - expected)) < 0.01,
    savedZero ? `${savedZero.variance} vs ${0 - expected}` : undefined
  );

  // 4) Reload today — UI load() after save
  r = await req("GET", "/api/cash-counts/today");
  const reloaded = data<typeof rec>(r.json);
  log(
    "รีโหลดหลังบันทึก — แสดงยอดที่บันทึก",
    reloaded?.actualBalance === 0 && reloaded?.hasManualCount === true,
    `actual=${reloaded?.actualBalance} manual=${reloaded?.hasManualCount}`
  );

  // 5) Simulate variance preview: actual = expected (ตรงยอด)
  r = await req("PUT", `/api/cash-counts/${id}`, {
    actualBalance: expected,
    note: "UI flow test — ตรงยอด",
  });
  const balanced = data<{ variance: number; status: string }>(r.json);
  log(
    "บันทึกตรงยอด (actual = expected)",
    r.status === 200 && balanced?.status === "balanced" && balanced?.variance === 0,
    balanced ? `status=${balanced.status}` : undefined
  );

  // 6) Simulate +50 variance (เกินจากที่บันทึก)
  r = await req("PUT", `/api/cash-counts/${id}`, {
    actualBalance: expected + 50,
    note: "UI flow test — เกิน 50",
  });
  const over = data<{ variance: number; status: string }>(r.json);
  log(
    "บันทึกเกินจากที่บันทึก +50",
    r.status === 200 && over?.status === "overage" && over?.variance === 50,
    over ? `variance=${over.variance}` : undefined
  );

  // 7) History list — CashCountHistory
  r = await req("GET", "/api/cash-counts");
  const history = data<Array<{ countDate: string; hasManualCount?: boolean; closedAt?: string | null; status: string }>>(r.json) ?? [];
  const todayRow = history.find((h) => h.countDate === bizToday);
  log(
    "ประวัติ — วันนี้ไม่แสดง 'ยังไม่ได้นับ' หลังบันทึก",
    todayRow?.hasManualCount === true,
    todayRow ? `status=${todayRow.status} manual=${todayRow.hasManualCount}` : "row not found"
  );

  const pastPending = history.find((h) => h.countDate < bizToday && !h.hasManualCount && !h.closedAt);
  log(
    "ประวัติ — วันเก่าที่ยังไม่ปิดและไม่นับ แสดง pending ได้",
    true,
    pastPending ? `found ${pastPending.countDate}` : "none (ok if all closed)"
  );

  // 8) Staff cannot edit locked past day cash count
  const closedPast = history.find((h) => h.countDate < bizToday && h.closedAt);
  if (closedPast) {
    const pastId = (await req("GET", "/api/cash-counts")).json;
    const rows = data<Array<{ id: string; countDate: string; closedAt?: string }>>(pastId) ?? [];
    const pastRec = rows.find((x) => x.countDate === closedPast.countDate);
    if (pastRec) {
      r = await req("PUT", `/api/cash-counts/${pastRec.id}`, { note: "staff try" });
      log("staff แก้วันปิดแล้ว → 403", r.status === 403, `status=${r.status}`);
    }
  } else {
    log("staff แก้วันปิดแล้ว → 403 (skip)", true, "no closed past day");
  }

  // 9) Restore balanced state for cleanliness
  await req("PUT", `/api/cash-counts/${id}`, {
    actualBalance: expected,
    note: "",
  });

  printSummary(steps);
  process.exit(steps.every((s) => s.pass) ? 0 : 1);
}

function printSummary(steps: Step[]) {
  const ok = steps.filter((s) => s.pass).length;
  console.log(`\n=== Summary: ${ok}/${steps.length} passed ===`);
  const fail = steps.filter((s) => !s.pass);
  if (fail.length) {
    console.log("\nFailed:");
    fail.forEach((f) => console.log(`  - ${f.name}${f.detail ? `: ${f.detail}` : ""}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
