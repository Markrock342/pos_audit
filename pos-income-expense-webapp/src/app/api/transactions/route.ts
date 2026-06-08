import { NextResponse } from "next/server";
import { AUDIT_CREATE_REASON } from "@/lib/services/db/auditLogs";
import { safeCreateAuditLog } from "@/lib/services/db/safeAuditLog";
import {
  getTransactions,
  createTransaction,
} from "@/lib/services/db/transactions";
import { transactionAuditSnapshot } from "@/lib/utils/auditSnapshot";
import type { Transaction } from "@/types";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";
import { getErrorMessage } from "@/lib/utils/errorMessage";
import { getBusinessToday } from "@/lib/utils/businessDate";
import { isAdminRequest } from "@/lib/api/requestRole";
import { assertTransactionDateAllowed } from "@/lib/api/transactionDateLock";
import { postTransactionSchema } from "@/lib/validations/transactionApi";

const DEFAULT_USER_ID = KIOSK_ACCOUNTS.find((a) => a.type === "customer")!.userId;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as Transaction["type"] | null;
  const status = searchParams.get("status") as Transaction["status"] | null;
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;

  const data = await getTransactions(DEFAULT_ORG_ID, {
    type: type ?? undefined,
    status: status ?? undefined,
    startDate,
    endDate,
  });

  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = postTransactionSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.format() } },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const userId = body.createdBy ?? DEFAULT_USER_ID;
    const txDate = body.transactionDate ?? getBusinessToday();
    const isAdmin = isAdminRequest(request);

    const dateBlocked = await assertTransactionDateAllowed(txDate, isAdmin);
    if (dateBlocked) return dateBlocked;

    const newTransaction = await createTransaction(
      {
        type: body.type,
        title: body.title,
        categoryId: body.lineItems[0].categoryId,
        amount: 0,
        note: body.note,
        paymentMethod: body.paymentMethod,
        referenceNo: body.referenceNo,
        transactionDate: txDate,
        createdBy: userId,
        organizationId: DEFAULT_ORG_ID,
      },
      body.lineItems
    );

    await safeCreateAuditLog({
      organizationId: DEFAULT_ORG_ID,
      userId,
      entityType: "transaction",
      entityId: newTransaction.id,
      transactionType: newTransaction.type,
      entityTitle: newTransaction.title,
      action: "create",
      reason: AUDIT_CREATE_REASON,
      oldValue: null,
      newValue: transactionAuditSnapshot(newTransaction),
    });

    return NextResponse.json({ data: newTransaction }, { status: 201 });
  } catch (err) {
    console.error("[transactions] POST failed:", JSON.stringify(err));
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: getErrorMessage(err, "Create transaction failed"),
        },
      },
      { status: 500 }
    );
  }
}
