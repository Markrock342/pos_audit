import { NextResponse } from "next/server";
import { safeCreateAuditLog } from "@/lib/services/db/safeAuditLog";
import {
  getTransaction,
  updateTransaction,
} from "@/lib/services/db/transactions";
import { transactionAuditSnapshot } from "@/lib/utils/auditSnapshot";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";
import { putTransactionSchema } from "@/lib/validations/transactionApi";

const DEFAULT_USER_ID = KIOSK_ACCOUNTS.find((a) => a.type === "customer")!.userId;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const transaction = await getTransaction(id);

  if (!transaction) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Transaction not found" } },
      { status: 404 }
    );
  }

  if (transaction.organizationId && transaction.organizationId !== DEFAULT_ORG_ID) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Access denied" } },
      { status: 403 }
    );
  }

  return NextResponse.json({ data: transaction });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const raw = await request.json();
    const parsed = putTransactionSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.format() } },
        { status: 400 }
      );
    }

    const existing = await getTransaction(id);
    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Transaction not found" } },
        { status: 404 }
      );
    }

    if (existing.status === "void") {
      return NextResponse.json(
        { error: { code: "INVALID_STATE", message: "Cannot edit a voided transaction" } },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const userId = body.updatedBy ?? DEFAULT_USER_ID;
    const oldSnapshot = transactionAuditSnapshot(existing);

    const updated = await updateTransaction(
      id,
      {
        title: body.title,
        paymentMethod: body.paymentMethod,
        transactionDate: body.transactionDate,
        note: body.note,
        referenceNo: body.referenceNo,
        updatedBy: userId,
      },
      body.lineItems
    );

    await safeCreateAuditLog({
      organizationId: existing.organizationId ?? DEFAULT_ORG_ID,
      userId,
      entityType: "transaction",
      entityId: id,
      transactionType: existing.type,
      entityTitle: updated.title,
      action: "update",
      reason: body.editReason,
      oldValue: oldSnapshot,
      newValue: transactionAuditSnapshot(updated),
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[transactions] PUT failed:", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: err instanceof Error ? err.message : "Update transaction failed",
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: {
        code: "INVALID_STATE",
        message:
          "Hard delete is not allowed. Use POST /api/transactions/[id]/void with voidReason instead.",
      },
    },
    { status: 405 }
  );
}
