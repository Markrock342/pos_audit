import { getDb } from "@/lib/db/supabase";
import { mapAuditLog, toAuditLogInsert } from "@/lib/utils/dbMap";
import { transactionAuditSnapshot } from "@/lib/utils/auditSnapshot";
import { getTransactions } from "@/lib/services/db/transactions";
import { getUsers } from "@/lib/services/db/users";
import { KIOSK_ACCOUNTS } from "@/constants/kioskUsers";
import type {
  AuditLog,
  AuditLogAction,
  AuditLogEntityType,
  TransactionType,
  User,
} from "@/types";

const TABLE = "audit_logs";
export const AUDIT_CREATE_REASON = "บันทึกรายการใหม่";

export interface AuditLogFilters {
  startDate?: string;
  endDate?: string;
  action?: AuditLogAction;
  transactionType?: TransactionType;
  entityType?: AuditLogEntityType;
}

export interface CreateAuditLogInput {
  organizationId: string;
  userId?: string;
  entityType: AuditLogEntityType;
  entityId: string;
  transactionType?: TransactionType;
  entityTitle?: string;
  action: AuditLogAction;
  reason: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
  const { data, error } = await getDb()
    .from(TABLE)
    .insert(toAuditLogInsert(input))
    .select()
    .single();
  if (error) throw error;
  return mapAuditLog(data as Record<string, unknown>);
}

export async function getAuditLogs(
  organizationId: string,
  filters?: AuditLogFilters
): Promise<AuditLog[]> {
  let q = getDb()
    .from(TABLE)
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (filters?.entityType) {
    q = q.eq("entity_type", filters.entityType);
  }
  if (filters?.action) {
    q = q.eq("action", filters.action);
  }
  if (filters?.transactionType) {
    q = q.eq("transaction_type", filters.transactionType);
  }
  if (filters?.startDate) {
    q = q.gte("created_at", `${filters.startDate}T00:00:00.000Z`);
  }
  if (filters?.endDate) {
    q = q.lte("created_at", `${filters.endDate}T23:59:59.999Z`);
  }

  const { data, error } = await q;
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapAuditLog);
}

function applyDateFilters(logs: AuditLog[], filters?: AuditLogFilters): AuditLog[] {
  let result = logs;
  if (filters?.startDate) {
    const start = `${filters.startDate}T00:00:00.000Z`;
    result = result.filter((l) => l.createdAt >= start);
  }
  if (filters?.endDate) {
    const end = `${filters.endDate}T23:59:59.999Z`;
    result = result.filter((l) => l.createdAt <= end);
  }
  return result;
}

function buildUserNameMap(organizationId: string, users: Awaited<ReturnType<typeof getUsers>>) {
  const map = new Map<string, string>();
  for (const user of users) {
    const row = user as User & Record<string, unknown>;
    const id = String(row.id);
    const name = String(row.name ?? "");
    if (id && name) {
      map.set(id, name);
    }
  }
  for (const account of KIOSK_ACCOUNTS) {
    if (account.organizationId === organizationId || !map.has(account.userId)) {
      map.set(account.userId, account.displayName);
    }
  }
  return map;
}

function enrichWithUserNames(
  logs: AuditLog[],
  organizationId: string,
  users: Awaited<ReturnType<typeof getUsers>>
): AuditLog[] {
  const nameById = buildUserNameMap(organizationId, users);
  return logs.map((log) => ({
    ...log,
    userName: log.userId ? nameById.get(log.userId) ?? "ไม่ทราบผู้ใช้" : "—",
  }));
}

/** รวม audit logs + รายการบันทึกเก่าที่ยังไม่มี create log */
export async function getActivityLogs(
  organizationId: string,
  filters?: AuditLogFilters
): Promise<AuditLog[]> {
  const includeLegacyCreates =
    !filters?.action || filters.action === "create";

  const logs = await getAuditLogs(organizationId, {
    ...filters,
    action: includeLegacyCreates ? filters?.action : filters?.action,
  });

  if (!includeLegacyCreates) {
    const users = await getUsers(organizationId);
    return enrichWithUserNames(logs, organizationId, users);
  }

  const createEntityIds = new Set(
    logs.filter((l) => l.action === "create").map((l) => l.entityId)
  );

  const transactions = await getTransactions(organizationId, {
    type: filters?.transactionType,
  });

  const legacyCreates: AuditLog[] = transactions
    .filter((t) => !createEntityIds.has(t.id))
    .map((t) => ({
      id: `legacy-create-${t.id}`,
      organizationId,
      userId: t.createdBy,
      entityType: "transaction",
      entityId: t.id,
      transactionType: t.type,
      entityTitle: t.title,
      action: "create",
      reason: AUDIT_CREATE_REASON,
      oldValue: null,
      newValue: transactionAuditSnapshot(t),
      createdAt: t.createdAt,
    }));

  let merged = [...logs, ...legacyCreates];

  if (filters?.action === "create") {
    merged = merged.filter((l) => l.action === "create");
  }

  merged = applyDateFilters(merged, filters);
  merged.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const users = await getUsers(organizationId);
  return enrichWithUserNames(merged, organizationId, users);
}
