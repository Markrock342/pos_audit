"use client";



import { useCallback, useEffect, useRef, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";

import { CashCountHistory } from "@/components/cash-count/CashCountHistory";

import { DailyLedgerSummaryPanel } from "@/components/cash-count/DailyLedgerSummaryPanel";

import { CashMovementActionsPanel } from "@/components/cash-movement/CashMovementActionsPanel";

import { CashMovementHistoryPanel } from "@/components/settings/CashMovementHistoryPanel";

import { useAuth } from "@/components/providers/AuthProvider";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

import { Button } from "@/components/ui/Button";

import { Input } from "@/components/ui/Input";

import { SegmentTabs } from "@/components/ui/SegmentTabs";

import { AmountDisplay, AmountNumpad } from "@/components/ui/AmountNumpad";

import { PinPadDialog } from "@/components/settings/PinPadDialog";
import { verifyDrawerPin } from "@/lib/hardware/drawerPinStorage";
import {
  CASH_COUNT_PAGE_CACHE_KEY,
  clearDrawerAndCloseDayApi,
  fetchCashCountPageData,
  invalidateCashCountPageCache,
  reopenCloseForEditApi,
  type CashCountPageData,
} from "@/lib/api/client";
import { canReopenCloseForEdit, isInCloseEditMode } from "@/lib/utils/closeEditUtils";

import {

  CASH_COUNT_STATUS_LABEL,

  CASH_COUNT_VARIANCE_HINT,

  cashCountStatusBadgeClass,

  getCashCountStatusFromVariance,

} from "@/lib/utils/cashCountVariance";

import { formatCurrency, formatDateShort } from "@/lib/utils/format";

import type { CashCount, DailyLedgerSummary } from "@/types";

import { Wallet, CheckCircle, AlertTriangle, Lock } from "lucide-react";



type CashCountTab = "today" | "movement" | "history";

const CASH_COUNT_TABS = [
  { id: "today" as const, label: "วันนี้" },
  { id: "movement" as const, label: "ฝาก / ถอน" },
  { id: "history" as const, label: "ประวัติปิดยอด" },
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



export default function CashCountPage() {

  const { session } = useAuth();

  const isAdmin = session?.role === "admin";

  const [countDate, setCountDate] = useState("");

  const [businessToday, setBusinessToday] = useState("");

  const [actualBalance, setActualBalance] = useState("0");

  const [expectedBalance, setExpectedBalance] = useState(0);

  const [existing, setExisting] = useState<CashCount | null>(null);

  const [isLocked, setIsLocked] = useState(false);

  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  const [historyKey, setHistoryKey] = useState(0);

  const [movementRefreshKey, setMovementRefreshKey] = useState(0);

  const [actualTouched, setActualTouched] = useState(false);

  const [ledger, setLedger] = useState<DailyLedgerSummary | null>(null);

  const [ledgerLoading, setLedgerLoading] = useState(true);

  const [history, setHistory] = useState<CashCount[]>([]);

  const [activeTab, setActiveTab] = useState<CashCountTab>("today");
  const [reopenPinOpen, setReopenPinOpen] = useState(false);
  const [reopenPinError, setReopenPinError] = useState<string | null>(null);
  const [reopening, setReopening] = useState(false);
  const reopenSubmittingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "history") setActiveTab("history");
    else if (tab === "movement") setActiveTab("movement");
  }, []);



  const applyPageData = useCallback((page: CashCountPageData) => {

    const today = page.today;

    const bizToday = page.businessToday;

    setBusinessToday(bizToday);

    setCountDate(today.data?.countDate ?? today.countDate ?? bizToday);

    setExpectedBalance(today.data?.expectedBalance ?? today.expectedBalance ?? 0);

    const pastDay = today.data && bizToday && today.data.countDate < bizToday;

    setIsLocked(
      pastDay ||
        ((today.isLocked ?? !!today.data?.closedAt) && !today.data?.closeEditReopenedAt)
    );



    if (today.data) {

      setExisting(today.data);

      setActualBalance(String(today.data.actualBalance));

      setNote(today.data.note ?? "");

      setExpectedBalance(today.data.expectedBalance);

      setActualTouched(!!today.data.hasManualCount);

    } else {

      setExisting(null);

      setActualBalance("0");

      setNote("");

      setActualTouched(false);

    }



    setLedger(page.ledger);

    setHistory(page.history);

  }, []);



  const load = useCallback(async (options?: { skipCache?: boolean }) => {

    const cached = options?.skipCache ? null : readPageCache();

    if (cached) {

      applyPageData(cached);

      setLoading(false);

      setLedgerLoading(false);

    } else {

      setLoading(true);

      setLedgerLoading(true);

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

    return () => {

      document.removeEventListener("visibilitychange", refresh);

    };

  }, [load]);



  const inCloseEditMode = isInCloseEditMode(existing);
  const canEditClose = canReopenCloseForEdit(existing, businessToday);
  const readOnly = isLocked && !inCloseEditMode;



  const handleNumpadChange = (val: string) => {
    if (readOnly) return;
    setActualBalance(val);
    setActualTouched(true);
  };



  const handleMovementSaved = useCallback(async () => {
    setMovementRefreshKey((k) => k + 1);
    clearPageCache();
    await load({ skipCache: true });
  }, [load]);



  const handleReopenPinComplete = async (pin: string) => {
    if (reopenSubmittingRef.current) return;
    if (!verifyDrawerPin(pin)) {
      setReopenPinError("รหัสไม่ถูกต้อง");
      return;
    }
    reopenSubmittingRef.current = true;
    setReopenPinOpen(false);
    setReopenPinError(null);
    setReopening(true);
    setMessage(null);
    try {
      const result = await reopenCloseForEditApi({ updatedBy: session?.userId });
      setMessage(result.message);
      setHistoryKey((k) => k + 1);
      clearPageCache();
      await load({ skipCache: true });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "เปิดแก้ไขปิดยอดไม่สำเร็จ");
    } finally {
      reopenSubmittingRef.current = false;
      setReopening(false);
    }
  };

  const handleSave = async () => {

    if (readOnly) return;

    if (existing && businessToday && existing.countDate !== businessToday) {

      setMessage("ข้อมูลวันค้าง — กำลังโหลดวันใหม่...");

      await load();

      return;

    }

    const actual = parseFloat(actualBalance);

    if (Number.isNaN(actual) || actual < 0) {

      setMessage("กรุณากรอกยอดเงินสดที่นับได้");

      return;

    }

    setSaving(true);

    setMessage(null);

    try {

      const result = await clearDrawerAndCloseDayApi({

        actualBalance: actual,

        note: note.trim() || undefined,

        recordedBy: session?.userId,

        updatedBy: session?.userId,

      });

      setMessage(result.message || "ปิดยอดแล้ว — ยอดใน POS เคลียร์เป็น 0");

      setHistoryKey((k) => k + 1);

      clearPageCache();

      await load({ skipCache: true });

    } catch (e) {

      setMessage(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");

    } finally {

      setSaving(false);

    }

  };



  const actualNum = parseFloat(actualBalance);

  const showVariance = actualTouched && !Number.isNaN(actualNum) && actualBalance !== "";

  const variance = showVariance ? actualNum - expectedBalance : 0;

  const varianceStatus = getCashCountStatusFromVariance(variance);

  const statusLabel = CASH_COUNT_STATUS_LABEL[varianceStatus];

  const isPendingCount = !readOnly && !showVariance;



  return (

    <AppLayout title="สรุปปิดยอด" subtitle="ฝาก/ถอน · สรุปวัน · ปิดยอดเมื่อจบวัน">

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pb-6">

        {inCloseEditMode && (
          <p className="shrink-0 rounded-xl border-2 border-amber-400/60 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-800 dark:text-amber-200">
            เปิดแก้ไขปิดยอดแล้ว — แก้ไขรายการ/ฝากถอนได้ แล้วกดปิดยอดใหม่เมื่อเสร็จ
          </p>
        )}

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

            <DailyLedgerSummaryPanel data={ledger} loading={ledgerLoading} />



            <Card className="shrink-0">

              <CardHeader>

                <CardTitle className="flex items-center gap-2 text-base">

                  <Wallet size={20} className="text-text-muted" />

                  นับเงินสดในลิ้นชัก

                </CardTitle>

                <p className="text-xs font-normal text-text-muted">

                  เทียบเงินที่นับได้กับยอดคำนวณ

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

                            กรอกยอดที่นับได้ แล้วกดปิดยอด — ระบบถอนเงินออกจาก POS และรีเซ็ตยอดหน้าหลัก

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

                          ฝาก + รายรับ(สด) − รายจ่าย(สด) − ถอน

                        </p>

                      </div>



                      <AmountDisplay

                        label="ยอดเงินที่นับได้ (รวมทั้งหมด)"

                        value={actualBalance}

                        active={!readOnly}

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

                          กรอกยอดเงินสดที่นับได้จริง แล้วกดปิดยอด

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

                            กรอกยอดเงินสดที่นับได้จริง

                          </p>

                          <AmountNumpad value={actualBalance} onChange={handleNumpadChange} />

                        </>

                      )}

                      <Button

                        className="w-full"

                        size="lg"

                        onClick={handleSave}

                        disabled={saving || readOnly}

                      >

                        {readOnly

                          ? "ปิดยอดแล้ว"

                          : saving

                            ? "กำลังปิดยอด..."

                            : inCloseEditMode

                              ? "ปิดยอดใหม่"

                              : "ปิดยอด"}

                      </Button>

                      {canEditClose && (

                        <Button

                          type="button"

                          className="w-full border-2 border-amber-500 bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700"

                          size="lg"

                          disabled={reopening}

                          onClick={() => {

                            setReopenPinError(null);

                            setReopenPinOpen(true);

                          }}

                        >

                          {reopening ? "กำลังเปิดแก้ไข..." : "แก้ไขปิดยอด"}

                        </Button>

                      )}

                    </div>

                  </div>

                )}

              </CardContent>

            </Card>

          </>

        )}



        {activeTab === "movement" && (

          <div className="flex flex-col gap-4">

            <Card className="shrink-0">

              <CardHeader className="pb-2">

                <CardTitle className="text-base">ฝาก / ถอนเงินสด</CardTitle>

                <p className="text-xs font-normal text-text-muted">

                  ไม่นับเป็นรายรับ–รายจ่ายธุรกิจ — ใส่รหัสเปิดลิ้นชักก่อนทำรายการ

                </p>

              </CardHeader>

              <CardContent>

                <CashMovementActionsPanel

                  onMovementSaved={() => void handleMovementSaved()}

                  disabled={isLocked}

                  disabledReason={
                    isLocked
                      ? "ปิดยอดแล้ว — ไม่สามารถฝากหรือถอนเงินสดได้"
                      : undefined
                  }

                />

              </CardContent>

            </Card>



            <Card>

              <CardHeader>

                <CardTitle>ประวัติฝาก / ถอน</CardTitle>

                <p className="text-sm font-normal text-text-muted">

                  บันทึกฝากและถอนเงินสด — แยกจากประวัติรายรับ–รายจ่าย

                </p>

              </CardHeader>

              <CardContent>

                <CashMovementHistoryPanel refreshKey={movementRefreshKey} />

              </CardContent>

            </Card>

          </div>

        )}



        {activeTab === "history" && (

          <CashCountHistory refreshKey={historyKey} items={history} loading={loading} />

        )}

      </div>

      <PinPadDialog
        key={reopenPinOpen ? "reopen-edit" : "closed"}
        open={reopenPinOpen}
        title="ใส่รหัสเปิดลิ้นชัก"
        subtitle="ยืนยันก่อนแก้ไขปิดยอด — รหัส 4 หลัก"
        error={reopenPinError}
        onComplete={(pin) => void handleReopenPinComplete(pin)}
        onCancel={() => {
          setReopenPinOpen(false);
          setReopenPinError(null);
        }}
      />

    </AppLayout>

  );

}

