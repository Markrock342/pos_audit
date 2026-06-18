import { getActivityLogs } from "@/lib/services/db/auditLogs";
import { apiSuccessList } from "@/lib/utils/apiError";
import { DEFAULT_ORG_ID } from "@/constants/organizations";
import type { AuditLogAction, AuditLogEntityType, TransactionType } from "@/types";

const VALID_ACTIONS: AuditLogAction[] = ["create", "update", "void"];
const VALID_ENTITY_TYPES: AuditLogEntityType[] = [
  "transaction",
  "category",
  "cash_deposit",
  "cash_withdrawal",
];
const VALID_TXN_TYPES: TransactionType[] = ["income", "expense"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;
  const actionParam = searchParams.get("action");
  const transactionTypeParam = searchParams.get("transactionType");
  const entityTypeParam = searchParams.get("entityType");

  const action =
    actionParam && VALID_ACTIONS.includes(actionParam as AuditLogAction)
      ? (actionParam as AuditLogAction)
      : undefined;

  const transactionType =
    transactionTypeParam &&
    VALID_TXN_TYPES.includes(transactionTypeParam as TransactionType)
      ? (transactionTypeParam as TransactionType)
      : undefined;

  const entityType =
    entityTypeParam && VALID_ENTITY_TYPES.includes(entityTypeParam as AuditLogEntityType)
      ? (entityTypeParam as AuditLogEntityType)
      : undefined;

  const data = await getActivityLogs(DEFAULT_ORG_ID, {
    startDate,
    endDate,
    action,
    transactionType,
    entityType,
  });

  return apiSuccessList(data, data.length);
}
