"use client";



import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { AppLayout } from "@/components/layout/AppLayout";

import { CloseEditModeBanner } from "@/components/cash-count/CloseEditModeBanner";
import { DailyLedgerSummaryPanel } from "@/components/cash-count/DailyLedgerSummaryPanel";

import { useAuth } from "@/components/providers/AuthProvider";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

import { Button } from "@/components/ui/Button";

import { Input } from "@/components/ui/Input";

import { AmountDisplay, AmountNumpad } from "@/components/ui/AmountNumpad";

import { PinPadDialog, type PinCompleteResult } from "@/components/settings/PinPadDialog";
import { openCashDrawer } from "@/lib/hardware/cashDrawer";
import { verifyDrawerPin } from "@/lib/hardware/drawerPinStorage";
import {
  CASH_COUNT_PAGE_CACHE_KEY,
  clearDrawerAndCloseDayApi,
  fetchCashCountPageData,
  invalidateCashCountPageCache,
  reopenCloseForEditApi,
  startNewCloseRoundApi,
  type CashCountPageData,
} from "@/lib/api/client";
import { canReopenCloseForEdit, isInCloseEditMode } from "@/lib/utils/closeEditUtils";
import { canStartNewCloseRound } from "@/lib/utils/sessionRound";

import {

  CASH_COUNT_STATUS_LABEL,

  CASH_COUNT_VARIANCE_HINT,

  cashCountStatusBadgeClass,

  getCashCountStatusFromVariance,

} from "@/lib/utils/cashCountVariance";

import { formatCurrency, formatDateShort } from "@/lib/utils/format";

import type { CashCount, DailyLedgerSummary } from "@/types";

import { Wallet, CheckCircle, AlertTriangle, Lock } from "lucide-react";

const PAGE_CACHE_KEY = CASH_COUNT_PAGE_CACHE_KEY;

type ClosePagePinMode = "close" | "reopen" | "new-round" | null;



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

  const router = useRouter();
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

  const [formError, setFormError] = useState<string | null>(null);

  const [actualTouched, setActualTouched] = useState(false);

  const [ledger, setLedger] = useState<DailyLedgerSummary | null>(null);

  const [ledgerLoading, setLedgerLoading] = useState(true);

  const [reopening, setReopening] = useState(false);
  const [startingNewRound, setStartingNewRound] = useState(false);
  const [pinMode, setPinMode] = useState<ClosePagePinMode>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [countingPhase, setCountingPhase] = useState(false);
  const reopenSubmittingRef = useRef(false);
  const newRoundSubmittingRef = useRef(false);
  const closeSubmittingRef = useRef(false);

  const closePin = useCallback(() => {
    setPinMode(null);
    setPinError(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "movement") {
      router.replace("/pos-cash");
      return;
    }
    if (tab === "history") {
      router.replace("/history?tab=close");
    }
  }, [router]);



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

    try {

      const page = await fetchCashCountPageData();

      applyPageData(page);

      writePageCache(page);

    } catch (e) {

      if (!cached) {

        /* โหลดไม่สำเร็จ — ใช้ cache ถ้ามี */

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
  const canNewRound = canStartNewCloseRound(existing, businessToday);
  const readOnly = isLocked && !inCloseEditMode;

  useEffect(() => {
    if (readOnly) setCountingPhase(false);
  }, [readOnly]);

  const handleNumpadChange = (val: string) => {
    if (readOnly || !countingPhase) return;
    setActualBalance(val);
    setActualTouched(true);
  };

  const cancelCounting = () => {
    setCountingPhase(false);
    setActualBalance("0");
    setActualTouched(false);
    setFormError(null);
  };



  const handleReopenPinComplete = async (pin: string): Promise<PinCompleteResult> => {
    if (reopenSubmittingRef.current) return false;
    if (!verifyDrawerPin(pin)) {
      setPinError("รหัสไม่ถูกต้อง");
      return false;
    }
    reopenSubmittingRef.current = true;
    closePin();
    setReopening(true);
    try {
      await reopenCloseForEditApi({ updatedBy: session?.userId });
      setCountingPhase(false);
      clearPageCache();
      await load({ skipCache: true });
    } catch {
      /* เปิดแก้ไขไม่สำเร็จ — สถานะหน้าไม่เปลี่ยน */
    } finally {
      reopenSubmittingRef.current = false;
      setReopening(false);
    }
    return true;
  };

  const handleNewRoundPinComplete = async (pin: string): Promise<PinCompleteResult> => {
    if (newRoundSubmittingRef.current) return false;
    if (!verifyDrawerPin(pin)) {
      setPinError("รหัสไม่ถูกต้อง");
      return false;
    }
    newRoundSubmittingRef.current = true;
    closePin();
    setStartingNewRound(true);
    try {
      const result = await startNewCloseRoundApi({ updatedBy: session?.userId });
      setCountingPhase(false);
      clearPageCache();
      await load({ skipCache: true });
    } catch {
      /* เริ่มรอบใหม่ไม่สำเร็จ */
    } finally {
      newRoundSubmittingRef.current = false;
      setStartingNewRound(false);
    }
    return true;
  };

  const handleClosePinComplete = async (pin: string): Promise<PinCompleteResult> => {
    if (closeSubmittingRef.current) return false;
    if (!verifyDrawerPin(pin)) {
      setPinError("รหัสไม่ถูกต้อง");
      return false;
    }
    closeSubmittingRef.current = true;
    closePin();
    setCountingPhase(true);
    setActualBalance("0");
    setActualTouched(false);
    closeSubmittingRef.current = false;

    void openCashDrawer();
    return true;
  };

  const handlePinComplete = async (pin: string): Promise<PinCompleteResult> => {
    if (pinMode === "close") return handleClosePinComplete(pin);
    if (pinMode === "reopen") return handleReopenPinComplete(pin);
    if (pinMode === "new-round") return handleNewRoundPinComplete(pin);
    return false;
  };

  const pinDialogTitle =
    pinMode === "reopen"
      ? "ใส่รหัสเปิดลิ้นชัก"
      : pinMode === "new-round"
        ? "ใส่รหัสเปิดลิ้นชัก"
        : "ใส่รหัสเปิดลิ้นชัก";

  const pinDialogSubtitle =
    pinMode === "reopen"
      ? "ยืนยันก่อนแก้ไขปิดยอด — รหัส 4 หลัก"
      : pinMode === "new-round"
        ? "ยืนยันก่อนเริ่มรอบใหม่ — ยอดเริ่ม 0 ฝากเงินเข้า POS ก่อนทำงาน"
        : "ยืนยันก่อนเปิดลิ้นชักนับเงิน — รหัส 4 หลัก";

  const handleStartClose = () => {
    if (readOnly) return;
    setPinError(null);
    setPinMode("close");
  };

  const handleSave = async () => {

    if (readOnly || !countingPhase) return;

    if (existing && businessToday && existing.countDate !== businessToday) {

      await load();

      return;

    }

    const actual = parseFloat(actualBalance);

    if (Number.isNaN(actual) || actual < 0) {

      setFormError("กรุณากรอกยอดเงินสดที่นับได้");

      return;

    }

    setSaving(true);

    setFormError(null);

    try {

      await clearDrawerAndCloseDayApi({

        actualBalance: actual,

        note: note.trim() || undefined,

        recordedBy: session?.userId,

        updatedBy: session?.userId,

      });

      setCountingPhase(false);
      clearPageCache();

      await load({ skipCache: true });

    } catch (e) {

      setFormError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");

    } finally {

      setSaving(false);

    }

  };



  const actualNum = parseFloat(actualBalance);

  const showVariance =
    countingPhase && actualTouched && !Number.isNaN(actualNum) && actualBalance !== "";

  const variance = showVariance ? actualNum - expectedBalance : 0;

  const varianceStatus = getCashCountStatusFromVariance(variance);

  const statusLabel = CASH_COUNT_STATUS_LABEL[varianceStatus];

  const isPendingCount = !readOnly && countingPhase && !showVariance;

  const closeButtonLabel = readOnly
    ? "ปิดยอดแล้ว"
    : saving
      ? "กำลังปิดยอด..."
      : inCloseEditMode
        ? "ปิดยอดใหม่"
        : "ปิดยอด";



  return (

    <AppLayout title="สรุปปิดยอด" subtitle="สรุปวัน · นับเงินในลิ้นชัก · ปิดยอดเมื่อจบวัน">

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pb-6">

        {inCloseEditMode && <CloseEditModeBanner context="cash-count" />}

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

                        ) : countingPhase ? (

                          <p className="text-xs text-text-muted">

                            นับเงินในลิ้นชัก กรอกยอดที่นับได้ แล้วกดปิดยอดเพื่อยืนยัน — ระบบจะแสดงเงินขาด/เกิน

                          </p>

                        ) : (

                          <p className="text-xs text-text-muted">

                            กดปิดยอดเพื่อเปิดลิ้นชัก — นับเงินแล้วกดปิดยอดอีกครั้งเพื่อยืนยัน

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

                        value={countingPhase ? actualBalance : "—"}

                        active={!readOnly && countingPhase}

                      />



                      <Input

                        label="หมายเหตุ (ถ้ามี)"

                        value={note}

                        onChange={(e) => !readOnly && countingPhase && setNote(e.target.value)}

                        placeholder="เช่น ทอนไม่พอ, เงินหาย"

                        disabled={readOnly || !countingPhase}

                      />



                      {isPendingCount && (

                        <p className="rounded-xl bg-surface-inset px-4 py-3 text-sm text-text-muted">

                          กรอกยอดเงินสดที่นับได้จริง แล้วกดปิดยอดเพื่อยืนยัน

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

                      {!readOnly && countingPhase && (

                        <>

                          <p className="text-center text-sm font-bold text-text-muted">

                            กรอกยอดเงินสดที่นับได้จริง

                          </p>

                          <AmountNumpad value={actualBalance} onChange={handleNumpadChange} />

                        </>

                      )}

                      {readOnly && canNewRound ? (
                        <Button
                          className="w-full"
                          size="lg"
                          disabled={startingNewRound}
                          onClick={() => {
                            setPinError(null);
                            setPinMode("new-round");
                          }}
                        >
                          {startingNewRound ? "กำลังเริ่มรอบใหม่..." : "เริ่มรอบใหม่"}
                        </Button>
                      ) : (
                        <>
                          <Button
                            className="w-full"
                            size="lg"
                            onClick={countingPhase ? handleSave : handleStartClose}
                            disabled={saving || readOnly}
                          >
                            {closeButtonLabel}
                          </Button>
                          {!readOnly && countingPhase && (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              size="lg"
                              disabled={saving}
                              onClick={cancelCounting}
                            >
                              ยกเลิกการนับ
                            </Button>
                          )}
                          {formError && (
                            <p className="text-center text-sm font-bold text-error">{formError}</p>
                          )}
                        </>
                      )}

                      {canEditClose && (

                        <Button

                          type="button"

                          className="w-full border-2 border-amber-500 bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700"

                          size="lg"

                          disabled={reopening}

                          onClick={() => {
                            setPinError(null);
                            setPinMode("reopen");
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

      </div>

      <PinPadDialog
        key={pinMode ?? "pin-closed"}
        open={pinMode !== null}
        title={pinDialogTitle}
        subtitle={pinDialogSubtitle}
        error={pinError}
        onComplete={handlePinComplete}
        onCancel={closePin}
      />

    </AppLayout>

  );

}

