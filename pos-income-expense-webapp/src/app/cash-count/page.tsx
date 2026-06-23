"use client";



import { useCallback, useEffect, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";

import { CashCountHistory } from "@/components/cash-count/CashCountHistory";

import { DailyLedgerSummaryPanel } from "@/components/cash-count/DailyLedgerSummaryPanel";

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

import type { CashCount, DailyLedgerSummary } from "@/types";

import { Wallet, CheckCircle, AlertTriangle, Lock } from "lucide-react";



type CashCountTab = "today" | "history";



const CASH_COUNT_TABS = [

  { id: "today" as const, label: "วันนี้" },

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

  const [clearing, setClearing] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  const [historyKey, setHistoryKey] = useState(0);

  const [actualTouched, setActualTouched] = useState(false);

  const [ledger, setLedger] = useState<DailyLedgerSummary | null>(null);

  const [ledgerLoading, setLedgerLoading] = useState(true);

  const [history, setHistory] = useState<CashCount[]>([]);

  const [activeTab, setActiveTab] = useState<CashCountTab>("today");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "history") setActiveTab("history");
  }, []);



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



  const readOnly = isLocked && !isAdmin;



  const handleNumpadChange = (val: string) => {
    if (readOnly) return;
    setActualBalance(val);
    setActualTouched(true);
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

      if (existing) {

        await updateCashCountApi(existing.id, {

          openingBalance: 0,

          actualBalance: actual,

          note: note.trim() || undefined,

          updatedBy: session?.userId,

        });

      } else {

        await saveCashCountApi({

          countDate: businessToday || countDate,

          openingBalance: 0,

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

    let actualForClear: number | undefined;
    if (actualTouched) {
      const actual = parseFloat(actualBalance);
      if (Number.isNaN(actual) || actual < 0) {
        setMessage("กรุณากรอกยอดเงินที่นับได้ก่อนเคลียร์ลิ้นชัก");
        return;
      }
      actualForClear = actual;
    }

    const closingAmount = ledger?.cash.closing ?? expectedBalance;
    const confirmMsg =
      closingAmount > 0
        ? `เคลียร์ลิ้นชัก — นำเงินออก ${formatCurrency(closingAmount)} และปิดวัน?\n\nยอดรับ-จ่ายบนหน้าหลักจะเคลียร์เป็น 0 · ดูประวัติได้ที่แท็บ ประวัติ`
        : "ปิดวัน (ลิ้นชักว่างแล้ว)?";

    if (!window.confirm(confirmMsg)) return;

    setClearing(true);
    setMessage(null);
    try {
      if (existing && actualForClear != null) {
        await updateCashCountApi(existing.id, {
          openingBalance: 0,
          actualBalance: actualForClear,
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

    <AppLayout title="สรุปปิดยอด" subtitle="เช้าใส่ทอน/ฝาก · กลางวันบันทึกรายการ · เย็นเคลียร์ลิ้นชัก">

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

            <DailyLedgerSummaryPanel data={ledger} loading={ledgerLoading} />



            <Card className="shrink-0">

              <CardHeader>

                <CardTitle className="flex items-center gap-2 text-base">

                  <Wallet size={20} className="text-text-muted" />

                  นับเงินสดในลิ้นชัก

                </CardTitle>

                <p className="text-xs font-normal text-text-muted">

                  เทียบเงินที่นับได้กับยอดคำนวณ — ฝาก/ถอนทำได้ที่ ตั้งค่า

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

                            แก้ไขได้จนถึงเที่ยงคืน · ระบบตัดยอดอัตโนมัติทุก 00:00 น.

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

                          กรอกยอดเงินสดที่นับได้จริง แล้วกด เคลียร์ลิ้นชัก — ปิดวัน

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

                        variant="outline"

                        onClick={handleSave}

                        disabled={saving || clearing || readOnly}

                      >

                        {saving ? "กำลังบันทึก..." : "บันทึกยอดนับ"}

                      </Button>

                      <Button

                        className="w-full"

                        size="lg"

                        variant="danger"

                        onClick={handleClearDrawer}

                        disabled={saving || clearing || readOnly}

                      >

                        {readOnly

                          ? "ปิดยอดแล้ว"

                          : clearing

                            ? "กำลังเคลียร์..."

                            : "เคลียร์ลิ้นชัก — ปิดวัน"}

                      </Button>

                    </div>

                  </div>

                )}

              </CardContent>

            </Card>

          </>

        )}



        {activeTab === "history" && (

          <CashCountHistory refreshKey={historyKey} items={history} loading={loading} />

        )}

      </div>

    </AppLayout>

  );

}

