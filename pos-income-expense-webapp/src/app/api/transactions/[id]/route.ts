import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuditLog } from "@/lib/services/db/auditLogs";
import {
  getTransaction,
  updateTransaction,
} from "@/lib/services/db/transactions";
import { transactionAuditSnapshot } from "@/lib/utils/auditSnapshot";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";

const DEFAULT_USER_ID = KIOSK_ACCOUNTS.find((a) => a.type === "customer")!.userId;

const putSchema = z.object({
  title: z.string().min(1).max(100),
  amount: z.coerce.number().positive("amount must be > 0"),
  categoryId: z.string().min(1),
  paymentMethod: z.enum(["cash", "transfer", "cheque", "card", "other"]),
  transactionDate: z.string().min(1),
  note: z.string().max(500).optional(),
  referenceNo: z.string().max(100).optional(),
  editReason: z.string().trim().min(1, "editReason is required"),
  updatedBy: z.string().optional(),
});

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
  const { id } = await params;
  const raw = await request.json();
  const parsed = putSchema.safeParse(raw);

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

  const updated = await updateTransaction(id, {
    title: body.title,
    amount: body.amount,
    categoryId: body.categoryId,
    paymentMethod: body.paymentMethod,
    transactionDate: body.transactionDate,
    note: body.note,
    referenceNo: body.referenceNo,
    updatedBy: userId,
  });

  await createAuditLog({
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
