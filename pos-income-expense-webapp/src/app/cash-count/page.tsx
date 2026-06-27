"use client";



import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";

import { AppLayout } from "@/components/layout/AppLayout";

import { DailyLedgerSummaryPanel } from "@/components/cash-count/DailyLedgerSummaryPanel";

import { useAuth } from "@/components/providers/AuthProvider";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

import { Button } from "@/components/ui/Button";

import { Input } from "@/components/ui/Input";

import { AmountDisplay, AmountNumpad } from "@/components/ui/AmountNumpad";

import { PinPadDialog, type PinCompleteResult } from "@/components/settings/PinPadDialog";
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

  const [message, setMessage] = useState<string | null>(null);

  const [actualTouched, setActualTouched] = useState(false);

  const [ledger, setLedger] = useState<DailyLedgerSummary | null>(null);

  const [ledgerLoading, setLedgerLoading] = useState(true);

  const [reopenPinOpen, setReopenPinOpen] = useState(false);
  const [reopenPinError, setReopenPinError] = useState<string | null>(null);
  const [reopening, setReopening] = useState(false);
  const [newRoundPinOpen, setNewRoundPinOpen] = useState(false);
  const [newRoundPinError, setNewRoundPinError] = useState<string | null>(null);
  const [startingNewRound, setStartingNewRound] = useState(false);
  const reopenSubmittingRef = useRef(false);
  const newRoundSubmittingRef = useRef(false);

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
  const canNewRound = canStartNewCloseRound(existing, businessToday);
  const readOnly = isLocked && !inCloseEditMode;



  const handleNumpadChange = (val: string) => {
    if (readOnly) return;
    setActualBalance(val);
    setActualTouched(true);
  };



  const handleReopenPinComplete = async (pin: string): Promise<PinCompleteResult> => {
    if (reopenSubmittingRef.current) return false;
    if (!verifyDrawerPin(pin)) {
      setReopenPinError("รหัสไม่ถูกต้อง");
      return false;
    }
    reopenSubmittingRef.current = true;
    setReopenPinOpen(false);
    setReopenPinError(null);
    setReopening(true);
    setMessage(null);
    try {
      const result = await reopenCloseForEditApi({ updatedBy: session?.userId });
      setMessage(result.message);
      clearPageCache();
      await load({ skipCache: true });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "เปิดแก้ไขปิดยอดไม่สำเร็จ");
    } finally {
      reopenSubmittingRef.current = false;
      setReopening(false);
    }
  };

  const handleNewRoundPinComplete = async (pin: string): Promise<PinCompleteResult> => {
    if (newRoundSubmittingRef.current) return false;
    if (!verifyDrawerPin(pin)) {
      setNewRoundPinError("รหัสไม่ถูกต้อง");
      return false;
    }
    newRoundSubmittingRef.current = true;
    setNewRoundPinOpen(false);
    setNewRoundPinError(null);
    setStartingNewRound(true);
    setMessage(null);
    try {
      const result = await startNewCloseRoundApi({ updatedBy: session?.userId });
      setMessage(result.message);
      clearPageCache();
      await load({ skipCache: true });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "เริ่มรอบใหม่ไม่สำเร็จ");
    } finally {
      newRoundSubmittingRef.current = false;
      setStartingNewRound(false);
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

    <AppLayout title="สรุปปิดยอด" subtitle="สรุปวัน · นับเงินในลิ้นชัก · ปิดยอดเมื่อจบวัน">

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pb-6">

        {inCloseEditMode && (
          <p className="shrink-0 rounded-xl border-2 border-amber-400/60 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-800 dark:text-amber-200">
            เปิดแก้ไขปิดยอดแล้ว — แก้ไขรายการได้ · ฝาก/ถอนที่{" "}
            <Link href="/pos-cash" className="underline">
              เงินสดใน POS
            </Link>{" "}
            · กดปิดยอดใหม่เมื่อเสร็จ
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

                      {readOnly && canNewRound ? (
                        <Button
                          className="w-full"
                          size="lg"
                          disabled={startingNewRound}
                          onClick={() => {
                            setNewRoundPinError(null);
                            setNewRoundPinOpen(true);
                          }}
                        >
                          {startingNewRound ? "กำลังเริ่มรอบใหม่..." : "ปิดยอดใหม่"}
                        </Button>
                      ) : (
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
                      )}

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

      </div>

      <PinPadDialog
        key={reopenPinOpen ? "reopen-edit" : "reopen-closed"}
        open={reopenPinOpen}
        title="ใส่รหัสเปิดลิ้นชัก"
        subtitle="ยืนยันก่อนแก้ไขปิดยอด — รหัส 4 หลัก"
        error={reopenPinError}
        onComplete={handleReopenPinComplete}
        onCancel={() => {
          setReopenPinOpen(false);
          setReopenPinError(null);
        }}
      />

      <PinPadDialog
        key={newRoundPinOpen ? "new-round" : "new-round-closed"}
        open={newRoundPinOpen}
        title="ใส่รหัสเปิดลิ้นชัก"
        subtitle="ยืนยันก่อนเริ่มรอบใหม่ — ยอดเริ่ม 0 ฝากเงินเข้า POS ก่อนทำงาน"
        error={newRoundPinError}
        onComplete={handleNewRoundPinComplete}
        onCancel={() => {
          setNewRoundPinOpen(false);
          setNewRoundPinError(null);
        }}
      />

    </AppLayout>

  );

}

