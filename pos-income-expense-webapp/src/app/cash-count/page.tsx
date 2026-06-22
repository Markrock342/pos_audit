"use client";

import { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CashCountHistory } from "@/components/cash-count/CashCountHistory";
import { DailyLedgerSummaryPanel } from "@/components/cash-count/DailyLedgerSummaryPanel";
import { DailyNotebookSummary } from "@/components/cash-count/DailyNotebookSummary";
import { CashWithdrawModal } from "@/components/cash-count/CashWithdrawModal";
import { CashWithdrawTodayPanel } from "@/components/cash-count/CashWithdrawTodayPanel";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SegmentTabs } from "@/components/ui/SegmentTabs";
import { AmountDisplay, AmountNumpad } from "@/components/ui/AmountNumpad";
import {
  CASH_COUNT_PAGE_CACHE_KEY,
  clearDrawerAndCloseDayApi,
  fetchCashCountPageData,
  invalidateCashCountPageCache,
  saveCashCountApi,
  updateCashCountApi,
  type CashCountPageData,
} from "@/lib/api/client";
import {
  CASH_COUNT_STATUS_LABEL,
  CASH_COUNT_VARIANCE_HINT,
  cashCountStatusBadgeClass,
  getCashCountStatusFromVariance,
} from "@/lib/utils/cashCountVariance";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import type { CashCount, CashWithdrawal, DailyLedgerSummary } from "@/types";
import { Wallet, CheckCircle, AlertTriangle, Lock, Moon } from "lucide-react";

type ActiveField = "opening" | "actual";
type CashCountTab = "today" | "withdraw" | "history";

const CASH_COUNT_TABS = [
  { id: "today" as const, label: "วันนี้" },
  { id: "withdraw" as const, label: "ถอนเงิน" },
  { id: "history" as const, label: "ประวัติ" },
];

const PAGE_CACHE_KEY = CASH_COUNT_PAGE_CACHE_KEY;

function readPageCache(): CashCountPageData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PAGE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as CashCountPageData) : null;
  } catch {
    return null;
  }
}

function writePageCache(data: CashCountPageData) {
  try {
    sessionStorage.setItem(PAGE_CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

function clearPageCache() {
  invalidateCashCountPageCache();
}

function applyWithdrawalToLedger(
  ledger: DailyLedgerSummary,
  amount: number
): DailyLedgerSummary {
  const withdrawn = ledger.cash.withdrawn + amount;
  const closing =
    ledger.cash.opening +
    ledger.cash.income -
    ledger.cash.expense -
    withdrawn +
    ledger.cash.deposited;
  return {
    ...ledger,
    cash: { ...ledger.cash, withdrawn, closing },
  };
}

export default function CashCountPage() {
  const { session } = useAuth();
  const isAdmin = session?.role === "admin";
  const [countDate, setCountDate] = useState("");
  const [businessToday, setBusinessToday] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [actualBalance, setActualBalance] = useState("0");
  const [activeField, setActiveField] = useState<ActiveField>("actual");
  const [expectedBalance, setExpectedBalance] = useState(0);
  const [existing, setExisting] = useState<CashCount | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [actualTouched, setActualTouched] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawals, setWithdrawals] = useState<CashWithdrawal[]>([]);
  const [withdrawTotal, setWithdrawTotal] = useState(0);
  const [withdrawCount, setWithdrawCount] = useState(0);
  const [withdrawLoading, setWithdrawLoading] = useState(true);
  const [ledger, setLedger] = useState<DailyLedgerSummary | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [history, setHistory] = useState<CashCount[]>([]);
  const [activeTab, setActiveTab] = useState<CashCountTab>("today");

  const applyPageData = useCallback((page: CashCountPageData) => {
    const today = page.today;
    const bizToday = page.businessToday;
    setBusinessToday(bizToday);
    setCountDate(today.data?.countDate ?? today.countDate ?? bizToday);
    setExpectedBalance(today.data?.expectedBalance ?? today.expectedBalance ?? 0);
    const pastDay = today.data && bizToday && today.data.countDate < bizToday;
    setIsLocked(pastDay || (today.isLocked ?? !!today.data?.closedAt));

    if (today.data) {
      setExisting(today.data);
      setOpeningBalance(String(today.data.openingBalance));
      setActualBalance(String(today.data.actualBalance));
      setNote(today.data.note ?? "");
      setExpectedBalance(today.data.expectedBalance);
      setActualTouched(!!today.data.hasManualCount);
    } else {
      setExisting(null);
      setOpeningBalance(String(today.openingBalance ?? 0));
      setActualBalance("0");
      setNote("");
      setActualTouched(false);
    }

    setLedger(page.ledger);
    setWithdrawals(page.withdrawals.data);
    setWithdrawTotal(page.withdrawals.totalWithdrawn);
    setWithdrawCount(page.withdrawals.count);
    setHistory(page.history);
  }, []);

  const load = useCallback(async (options?: { skipCache?: boolean }) => {
    const cached = options?.skipCache ? null : readPageCache();
    if (cached) {
      applyPageData(cached);
      setLoading(false);
      setLedgerLoading(false);
      setWithdrawLoading(false);
    } else {
      setLoading(true);
      setLedgerLoading(true);
      setWithdrawLoading(true);
    }
    setMessage(null);
    try {
      const page = await fetchCashCountPageData();
      applyPageData(page);
      writePageCache(page);
    } catch (e) {
      if (!cached) {
        setMessage(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    } finally {
      setLoading(false);
      setLedgerLoading(false);
      setWithdrawLoading(false);
    }
  }, [applyPageData]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      clearPageCache();
      void load({ skipCache: true });
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [load]);

  const handleWithdrawSaved = (created: CashWithdrawal) => {
    setWithdrawals((prev) => [created, ...prev]);
    setWithdrawTotal((prev) => prev + created.amount);
    setWithdrawCount((prev) => prev + 1);
    setLedger((prev) => (prev ? applyWithdrawalToLedger(prev, created.amount) : prev));
    setExpectedBalance((prev) => prev - created.amount);
    setExisting((prev) =>
      prev
        ? {
            ...prev,
            expectedBalance: prev.expectedBalance - created.amount,
            cashWithdrawn: (prev.cashWithdrawn ?? 0) + created.amount,
            closingCash: (prev.closingCash ?? prev.expectedBalance) - created.amount,
          }
        : prev
    );
    setHistoryKey((k) => k + 1);
    clearPageCache();
    void load({ skipCache: true });
  };

  const readOnly = isLocked && !isAdmin;

  const handleNumpadChange = (val: string) => {
    if (readOnly) return;
    if (activeField === "opening") setOpeningBalance(val);
    else {
      setActualBalance(val);
      setActualTouched(true);
    }
  };

  const numpadValue = activeField === "opening" ? openingBalance : actualBalance;

  const handleSave = async () => {
    if (readOnly) return;
    if (existing && businessToday && existing.countDate !== businessToday) {
      setMessage("ข้อมูลวันค้าง — กำลังโหลดวันใหม่...");
      await load();
      return;
    }
    const opening = parseFloat(openingBalance) || 0;
    const actual = parseFloat(actualBalance);
    if (Number.isNaN(actual) || actual < 0) {
      setMessage("กรุณากรอกยอดเงินสดที่นับได้");
      setActiveField("actual");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      if (existing) {
        await updateCashCountApi(existing.id, {
          openingBalance: opening,
          actualBalance: actual,
          note: note.trim() || undefined,
          updatedBy: session?.userId,
        });
      } else {
        await saveCashCountApi({
          countDate: businessToday || countDate,
          openingBalance: opening,
          actualBalance: actual,
          note: note.trim() || undefined,
          countedBy: session?.userId,
        });
      }
      setMessage("บันทึกปิดยอดเงินสดแล้ว");
      setHistoryKey((k) => k + 1);
      clearPageCache();
      await load({ skipCache: true });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleClearDrawer = async () => {
    if (readOnly || clearing) return;

    const opening = parseFloat(openingBalance) || 0;
    let actualForClear: number | undefined;

    if (actualTouched) {
      const actual = parseFloat(actualBalance);
      if (Number.isNaN(actual) || actual < 0) {
        setMessage("กรุณากรอกยอดเงินที่นับได้ก่อนเคลียร์ลิ้นชัก");
        setActiveField("actual");
        return;
      }
      actualForClear = actual;
    }

    const closingAmount = ledger?.cash.closing ?? expectedBalance;
    const confirmMsg =
      closingAmount > 0
        ? `เคลียร์ลิ้นชัก — นำเงินออก ${formatCurrency(closingAmount)} และปิดวัน?\n\nพรุ่งนี้เช้าใส่เงินทอนใหม่`
        : "ปิดวัน (ลิ้นชักว่างแล้ว)?";

    if (!window.confirm(confirmMsg)) return;

    setClearing(true);
    setMessage(null);
    try {
      if (existing) {
        await updateCashCountApi(existing.id, {
          openingBalance: opening,
          actualBalance: actualForClear ?? existing.actualBalance,
          note: note.trim() || undefined,
          updatedBy: session?.userId,
        });
      }

      const result = await clearDrawerAndCloseDayApi({
        actualBalance: actualForClear,
        note: note.trim() || undefined,
        recordedBy: session?.userId,
        updatedBy: session?.userId,
      });

      setMessage(result.message);
      setHistoryKey((k) => k + 1);
      clearPageCache();
      await load({ skipCache: true });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "เคลียร์ลิ้นชักไม่สำเร็จ");
    } finally {
      setClearing(false);
    }
  };

  const actualNum = parseFloat(actualBalance);
  const showVariance = actualTouched && !Number.isNaN(actualNum) && actualBalance !== "";
  const variance = showVariance ? actualNum - expectedBalance : 0;
  const varianceStatus = getCashCountStatusFromVariance(variance);
  const statusLabel = CASH_COUNT_STATUS_LABEL[varianceStatus];
  const isPendingCount = !readOnly && !showVariance;

  return (
    <AppLayout title="สรุปปิดยอด" subtitle="เช้าใส่ทอน · กลางวันจดรายการ · เย็นเคลียร์ลิ้นชัก">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pb-6">
        {message && (
          <p
            className={`shrink-0 rounded-xl px-4 py-3 text-sm font-bold ${
              message.includes("แล้ว") ? "bg-income-light text-income" : "bg-error-light text-error"
            }`}
          >
            {message}
          </p>
        )}

        <SegmentTabs tabs={CASH_COUNT_TABS} active={activeTab} onChange={(id) => setActiveTab(id as CashCountTab)} />

        {activeTab === "today" && (
          <>
            <DailyNotebookSummary
              ledger={ledger}
              loading={ledgerLoading}
              actualBalance={showVariance ? actualNum : null}
            />

            <DailyLedgerSummaryPanel data={ledger} loading={ledgerLoading} />

            {!readOnly && (parseFloat(openingBalance) || 0) === 0 && (
              <p className="rounded-xl border-2 border-brand/30 bg-brand/5 px-4 py-3 text-sm font-bold text-brand">
                เช้า — ใส่เงินทอนที่ใส่ในลิ้นชักวันนี้ (กดช่อง &quot;ยอดเงินทอน&quot; ด้านล่าง)
              </p>
            )}

            <Card className="shrink-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet size={20} className="text-text-muted" />
                  นับเงินสดในลิ้นชัก
                </CardTitle>
                <p className="text-xs font-normal text-text-muted">
                  เย็น — นับเงินที่เหลือ แล้วกดเคลียร์ลิ้นชัก (เอาเงินออกหมด · ปิดวัน)
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-text-muted">กำลังโหลด...</p>
                ) : (
                  <div className="pos-cash-grid pos-cash-form grid grid-cols-1 gap-6 2xl:grid-cols-2 2xl:gap-6">
                    <div className="pos-cash-form flex flex-col gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-text-secondary">
                          วันที่: <strong>{formatDateShort(countDate)}</strong>
                        </p>
                        {readOnly ? (
                          <p className="flex items-center gap-1.5 text-sm font-bold text-text-muted">
                            <Lock size={14} />
                            ปิดยอดแล้ว — แก้ไขไม่ได้
                          </p>
                        ) : (
                          <p className="text-xs text-text-muted">
                            เช้าใส่เงินทอน · เย็นนับแล้วกดเคลียร์ลิ้นชัก
                          </p>
                        )}
                        {isLocked && isAdmin && (
                          <p className="text-xs font-bold text-brand">Admin: แก้ไขวันที่ปิดแล้วได้</p>
                        )}
                      </div>

                      <div className="rounded-xl bg-surface-inset p-4">
                        <p className="text-sm text-text-muted">เงินในลิ้นชัก (คำนวณ)</p>
                        <p className="text-3xl font-black text-brand">
                          {formatCurrency(ledger?.cash.closing ?? expectedBalance)}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          ยอดเงินทอน + รายรับเงินสด − รายจ่ายเงินสด − ถอนออกวันนี้
                        </p>
                      </div>

                      <AmountDisplay
                        label="ยอดเงินทอน (เปิดวัน)"
                        value={openingBalance}
                        active={!readOnly && activeField === "opening"}
                        onClick={() => !readOnly && setActiveField("opening")}
                      />

                      <AmountDisplay
                        label="ยอดเงินที่นับได้ (รวมทั้งหมด)"
                        value={actualBalance}
                        active={!readOnly && activeField === "actual"}
                        onClick={() => !readOnly && setActiveField("actual")}
                      />

                      <Input
                        label="หมายเหตุ (ถ้ามี)"
                        value={note}
                        onChange={(e) => !readOnly && setNote(e.target.value)}
                        placeholder="เช่น ทอนไม่พอ, เงินหาย"
                        disabled={readOnly}
                      />

                      {isPendingCount && (
                        <p className="rounded-xl bg-surface-inset px-4 py-3 text-sm text-text-muted">
                          เย็น — กรอกยอดที่นับได้ แล้วกดเคลียร์ลิ้นชัก (หรือบันทึกยอดนับก่อนปิด)
                        </p>
                      )}

                      {showVariance && (
                        <div
                          className={`flex items-start gap-3 rounded-xl p-4 ${cashCountStatusBadgeClass(varianceStatus)}`}
                        >
                          {varianceStatus === "balanced" ? (
                            <CheckCircle size={22} className="mt-0.5 shrink-0" />
                          ) : (
                            <AlertTriangle size={22} className="mt-0.5 shrink-0" />
                          )}
                          <div className="min-w-0 space-y-1">
                            <p className="font-bold">{statusLabel}</p>
                            {varianceStatus !== "balanced" && (
                              <p className="text-sm font-semibold">
                                ส่วนต่าง: {variance >= 0 ? "+" : ""}
                                {formatCurrency(variance)}
                              </p>
                            )}
                            <p className="text-xs opacity-90">{CASH_COUNT_VARIANCE_HINT}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-4 2xl:sticky 2xl:top-4 2xl:self-start">
                      {!readOnly && (
                        <>
                          <p className="text-center text-sm font-bold text-text-muted">
                            กำลังกรอก: {activeField === "opening" ? "ยอดเงินทอน" : "ยอดที่นับได้"}
                          </p>
                          <AmountNumpad value={numpadValue} onChange={handleNumpadChange} />
                        </>
                      )}
                      <Button
                        className="w-full"
                        size="lg"
                        variant="secondary"
                        onClick={handleSave}
                        disabled={saving || clearing || readOnly}
                      >
                        {readOnly
                          ? "ปิดยอดแล้ว"
                          : saving
                            ? "กำลังบันทึก..."
                            : existing?.hasManualCount
                              ? "อัปเดตยอดนับ"
                              : "บันทึกยอดนับ"}
                      </Button>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleClearDrawer}
                        disabled={clearing || saving || readOnly}
                      >
                        {readOnly ? (
                          "เคลียร์ลิ้นชักแล้ว"
                        ) : clearing ? (
                          "กำลังเคลียร์..."
                        ) : (
                          <span className="inline-flex items-center justify-center gap-2">
                            <Moon size={18} />
                            เคลียร์ลิ้นชัก — ปิดวัน
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "withdraw" && (
          <CashWithdrawTodayPanel
            items={withdrawals}
            totalWithdrawn={withdrawTotal}
            count={withdrawCount}
            loading={withdrawLoading}
            readOnly={readOnly}
            onWithdrawClick={() => setWithdrawOpen(true)}
          />
        )}

        {activeTab === "history" && (
          <CashCountHistory refreshKey={historyKey} items={history} loading={loading} />
        )}
      </div>

      <CashWithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onSaved={handleWithdrawSaved}
        recordedBy={session?.userId}
        readOnly={readOnly}
      />
    </AppLayout>
  );
}
