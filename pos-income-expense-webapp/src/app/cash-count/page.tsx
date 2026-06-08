"use client";

import { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CashCountHistory } from "@/components/cash-count/CashCountHistory";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AmountDisplay, AmountNumpad } from "@/components/ui/AmountNumpad";
import {
  fetchCashCountToday,
  saveCashCountApi,
  updateCashCountApi,
} from "@/lib/api/client";
import {
  CASH_COUNT_STATUS_LABEL,
  CASH_COUNT_VARIANCE_HINT,
  cashCountStatusBadgeClass,
  getCashCountStatusFromVariance,
} from "@/lib/utils/cashCountVariance";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import type { CashCount } from "@/types";
import { Wallet, CheckCircle, AlertTriangle, Lock } from "lucide-react";

type ActiveField = "opening" | "actual";

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
  const [message, setMessage] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [actualTouched, setActualTouched] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const today = await fetchCashCountToday();
      const bizToday = today.businessToday ?? today.countDate ?? "";
      setBusinessToday(bizToday);
      const date = today.data?.countDate ?? bizToday;
      setCountDate(date);
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
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
      await load();
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
    <AppLayout title="ปิดยอดเงินสด" subtitle="ตัดยอดอัตโนมัติเที่ยงคืน · วันเก่าแก้ไขไม่ได้">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 xl:h-[calc(100vh-8rem)] xl:max-h-[calc(100vh-8rem)] xl:overflow-hidden">
        {message && (
          <p
            className={`shrink-0 rounded-xl px-4 py-3 text-sm font-bold ${
              message.includes("แล้ว") ? "bg-income-light text-income" : "bg-error-light text-error"
            }`}
          >
            {message}
          </p>
        )}

        <Card className="shrink-0 border-t-4 border-t-brand">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet size={22} className="text-brand" />
              นับเงินสดประจำวัน
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-text-muted">กำลังโหลด...</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-8">
                <div className="flex flex-col gap-4">
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
                    <p className="text-sm text-text-muted">ยอดที่ระบบคาดหวัง</p>
                    <p className="text-3xl font-black text-brand">{formatCurrency(expectedBalance)}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      ยอดเปิด + รายรับเงินสด − รายจ่ายเงินสด
                    </p>
                  </div>

                  <AmountDisplay
                    label="ยอดเงินสดเปิดร้าน (เช้า)"
                    value={openingBalance}
                    active={!readOnly && activeField === "opening"}
                    onClick={() => !readOnly && setActiveField("opening")}
                  />

                  <AmountDisplay
                    label="ยอดเงินสดที่นับได้จริง (ตอนปิด)"
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
                      กรอกยอดเงินสดที่นับได้จริง แล้วกดบันทึกปิดยอด
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

                <div className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
                  {!readOnly && (
                    <>
                      <p className="text-center text-sm font-bold text-text-muted">
                        กำลังกรอก: {activeField === "opening" ? "ยอดเปิดร้าน" : "ยอดนับจริง"}
                      </p>
                      <AmountNumpad value={numpadValue} onChange={handleNumpadChange} />
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
                        ? "กำลังบันทึก..."
                        : existing?.hasManualCount
                          ? "อัปเดตปิดยอด"
                          : "บันทึกปิดยอด"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="min-h-0 flex-1 overflow-hidden">
          <CashCountHistory refreshKey={historyKey} />
        </div>
      </div>
    </AppLayout>
  );
}
