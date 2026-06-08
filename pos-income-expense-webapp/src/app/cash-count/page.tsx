"use client";

import { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  fetchCashCountToday,
  saveCashCountApi,
  updateCashCountApi,
} from "@/lib/api/client";
import { formatCurrency, formatDateShort } from "@/lib/utils/format";
import type { CashCount } from "@/types";
import { Wallet, CheckCircle, AlertTriangle } from "lucide-react";

export default function CashCountPage() {
  const [countDate, setCountDate] = useState(new Date().toISOString().slice(0, 10));
  const [openingBalance, setOpeningBalance] = useState("0");
  const [actualBalance, setActualBalance] = useState("");
  const [expectedBalance, setExpectedBalance] = useState(0);
  const [existing, setExisting] = useState<CashCount | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const today = await fetchCashCountToday();
      const date =
        today.data?.countDate ??
        today.countDate ??
        new Date().toISOString().slice(0, 10);
      setCountDate(date);
      setExpectedBalance(today.data?.expectedBalance ?? today.expectedBalance ?? 0);
      if (today.data) {
        setExisting(today.data);
        setOpeningBalance(String(today.data.openingBalance));
        setActualBalance(String(today.data.actualBalance));
        setNote(today.data.note ?? "");
        setExpectedBalance(today.data.expectedBalance);
      } else {
        setExisting(null);
        setOpeningBalance(String(today.openingBalance));
        setActualBalance("");
        setNote("");
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

  const handleSave = async () => {
    const opening = parseFloat(openingBalance) || 0;
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
          openingBalance: opening,
          actualBalance: actual,
          note: note.trim() || undefined,
        });
      } else {
        await saveCashCountApi({
          countDate,
          openingBalance: opening,
          actualBalance: actual,
          note: note.trim() || undefined,
        });
      }
      setMessage("บันทึกปิดยอดเงินสดแล้ว");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const variance =
    actualBalance !== ""
      ? parseFloat(actualBalance) - expectedBalance
      : existing?.variance ?? 0;

  const statusLabel =
    variance === 0 ? "ตรงยอด" : variance < 0 ? "ขาดเงิน" : "เกินเงิน";

  return (
    <AppLayout title="ปิดยอดเงินสด">
      <div className="mx-auto max-w-xl space-y-6">
        {message && (
          <p
            className={`rounded-xl px-4 py-3 text-sm font-bold ${
              message.includes("แล้ว") ? "bg-income-light text-income" : "bg-error-light text-error"
            }`}
          >
            {message}
          </p>
        )}

        <Card className="border-t-4 border-t-brand">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet size={22} className="text-brand" />
              นับเงินสดประจำวัน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-text-muted">กำลังโหลด...</p>
            ) : (
              <>
                <p className="text-sm text-text-secondary">
                  วันที่: <strong>{formatDateShort(countDate)}</strong>
                  {existing && " (บันทึกแล้ว — แก้ไขได้)"}
                </p>

                <div className="rounded-xl bg-surface-inset p-4 space-y-2">
                  <p className="text-sm text-text-muted">ยอดที่ระบบคาดหวัง (เงินสดวันนี้)</p>
                  <p className="text-3xl font-black text-brand">{formatCurrency(expectedBalance)}</p>
                  <p className="text-xs text-text-muted">
                    คำนวณจาก: ยอดเปิด + รายรับเงินสด − รายจ่ายเงินสด
                  </p>
                </div>

                <Input
                  label="ยอดเงินสดเปิดร้าน (เช้า)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                />
                <Input
                  label="ยอดเงินสดที่นับได้จริง (ตอนปิด)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={actualBalance}
                  onChange={(e) => setActualBalance(e.target.value)}
                  placeholder="กรอกจำนวนที่นับได้"
                />
                <Input
                  label="หมายเหตุ (ถ้ามี)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น ทอนไม่พอ, เงินหาย"
                />

                {actualBalance !== "" && (
                  <div
                    className={`flex items-center gap-3 rounded-xl p-4 ${
                      variance === 0
                        ? "bg-income-light text-income"
                        : "bg-expense-light text-expense"
                    }`}
                  >
                    {variance === 0 ? <CheckCircle size={22} /> : <AlertTriangle size={22} />}
                    <div>
                      <p className="font-bold">{statusLabel}</p>
                      <p className="text-sm">
                        ส่วนต่าง: {variance >= 0 ? "+" : ""}
                        {formatCurrency(variance)}
                      </p>
                    </div>
                  </div>
                )}

                <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
                  {saving ? "กำลังบันทึก..." : existing ? "อัปเดตปิดยอด" : "บันทึกปิดยอด"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
