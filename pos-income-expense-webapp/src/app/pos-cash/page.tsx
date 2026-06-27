"use client";



import Link from "next/link";

import { AppLayout } from "@/components/layout/AppLayout";

import { CashMovementActionsPanel } from "@/components/cash-movement/CashMovementActionsPanel";

import { CashMovementHistoryPanel } from "@/components/settings/CashMovementHistoryPanel";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

import { usePosCashPage } from "@/hooks/usePosCashPage";



export default function PosCashPage() {

  const {

    readOnly,

    dayCleared,

    inCloseEditMode,

    deposits,

    withdrawals,

    depositTotal,

    withdrawTotal,

    loading,

    error,

    statusReady,

    reloadAfterMovement,

  } = usePosCashPage();



  return (

    <AppLayout title="เงินสดใน POS" subtitle="ฝาก / ถอนเงินสด — ไม่นับเป็นรายรับ–รายจ่ายธุรกิจ">

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 pb-6">

        {error && (

          <p className="shrink-0 rounded-xl bg-error-light px-4 py-3 text-sm font-bold text-error">

            {error}

          </p>

        )}



        {inCloseEditMode && (

          <p className="shrink-0 rounded-xl border-2 border-amber-400/60 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-800 dark:text-amber-200">

            เปิดแก้ไขปิดยอดแล้ว — ฝาก/ถอนได้ · ปิดยอดใหม่ได้ที่{" "}

            <Link href="/cash-count" className="underline">

              สรุปปิดยอด

            </Link>

          </p>

        )}



        {readOnly && !inCloseEditMode && (

          <p className="shrink-0 rounded-xl border-2 border-amber-400/60 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-800 dark:text-amber-200">

            ปิดยอดแล้ว — ไม่สามารถฝากหรือถอนได้ · แก้ไขได้ที่{" "}

            <Link href="/cash-count" className="underline">

              สรุปปิดยอด → แก้ไขปิดยอด (PIN)

            </Link>

          </p>

        )}



        <Card className="shrink-0">

          <CardHeader className="pb-2">

            <CardTitle className="text-base">ฝาก / ถอนเงินสด</CardTitle>

            <p className="text-xs font-normal text-text-muted">

              ไม่นับเป็นรายรับ–รายจ่ายธุรกิจ — ใส่รหัสเปิดลิ้นชักก่อนทำรายการ

            </p>

          </CardHeader>

          <CardContent>

            <CashMovementActionsPanel

              onMovementSaved={() => void reloadAfterMovement()}

              disabled={statusReady ? readOnly : false}

              disabledReason={

                statusReady && readOnly

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

            <CashMovementHistoryPanel

              dayCleared={dayCleared}

              deposits={deposits}

              withdrawals={withdrawals}

              depositTotal={depositTotal}

              withdrawTotal={withdrawTotal}

              loading={loading}

            />

          </CardContent>

        </Card>

      </div>

    </AppLayout>

  );

}


