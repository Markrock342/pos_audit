import { NextResponse, after } from "next/server";
import { safeCreateAuditLog } from "@/lib/services/db/safeAuditLog";
import { withCloseEditAuditMeta } from "@/lib/services/db/closeEdit";
import {
  getTransaction,
  voidTransaction,
} from "@/lib/services/db/transactions";
import { transactionAuditSnapshot } from "@/lib/utils/auditSnapshot";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";
import { isAdminRequest } from "@/lib/api/requestRole";
import { assertTransactionDateAllowed } from "@/lib/api/transactionDateLock";
import { ensureKioskUserById } from "@/lib/services/db/kioskUsers";
import { syncTodayLedgerAfterMutation } from "@/lib/services/db/cashCountPage";

const DEFAULT_USER_ID = KIOSK_ACCOUNTS.find((a) => a.type === "customer")!.userId;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await getTransaction(id);
  if (!existing) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Transaction not found" } },
      { status: 404 }
    );
  }

  if (existing.status === "void") {
    return NextResponse.json(
      { error: { code: "INVALID_STATE", message: "Transaction is already voided" } },
      { status: 400 }
    );
  }

  if (!body.voidReason || body.voidReason.trim().length === 0) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "voidReason is required" } },
      { status: 400 }
    );
  }

  const isAdmin = isAdminRequest(request);
  const dateBlocked = await assertTransactionDateAllowed(existing.transactionDate, isAdmin);
  if (dateBlocked) return dateBlocked;

  const userId = body.voidedBy ?? DEFAULT_USER_ID;
  await ensureKioskUserById(userId);
  const oldSnapshot = transactionAuditSnapshot(existing);

  const voided = await voidTransaction(
    id,
    body.voidReason.trim(),
    userId
  );

  after(async () => {
    await safeCreateAuditLog(
      await withCloseEditAuditMeta(existing.organizationId ?? DEFAULT_ORG_ID, existing.transactionDate, {
        organizationId: existing.organizationId ?? DEFAULT_ORG_ID,
        userId,
        entityType: "transaction",
        entityId: id,
        transactionType: existing.type,
        entityTitle: existing.title,
        action: "void",
        reason: body.voidReason.trim(),
        oldValue: oldSnapshot,
        newValue: transactionAuditSnapshot(voided),
      })
    );

    await syncTodayLedgerAfterMutation(
      existing.organizationId ?? DEFAULT_ORG_ID,
      existing.transactionDate,
      existing,
      "revert"
    );
  });

  return NextResponse.json({ data: voided });
}
