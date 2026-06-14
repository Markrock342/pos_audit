import { getDb } from "@/lib/db/supabase";
import { mapOrganization, toOrganizationUpdate } from "@/lib/utils/dbMap";
import type { Organization } from "@/types";

const TABLE = "organizations";

export async function getOrganization(id: string): Promise<Organization | null> {
  const { data, error } = await getDb()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapOrganization(data as Record<string, unknown>);
}

export async function getOrganizations(): Promise<Organization[]> {
  const { data, error } = await getDb().from(TABLE).select("*");
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapOrganization);
}

export async function createOrganization(
  data: Omit<Organization, "id" | "createdAt">
): Promise<Organization> {
  const org = {
    ...toOrganizationUpdate(data),
    created_at: new Date().toISOString(),
  };
  const { data: inserted, error } = await getDb()
    .from(TABLE)
    .insert(org)
    .select()
    .single();
  if (error) throw error;
  return mapOrganization(inserted as Record<string, unknown>);
}

export async function updateOrganization(
  id: string,
  data: Partial<Omit<Organization, "id" | "createdAt">>
): Promise<Organization> {
  const patch = toOrganizationUpdate(data);

  if (data.receiptConfig !== undefined) {
    const existing = await getOrganization(id);
    patch.receipt_config = {
      ...(existing?.receiptConfig ?? {}),
      ...(patch.receipt_config as Record<string, unknown>),
    };
  }

  const { data: updated, error } = await getDb()
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapOrganization(updated as Record<string, unknown>);
}

export async function deleteOrganization(id: string): Promise<void> {
  const { error } = await getDb().from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
