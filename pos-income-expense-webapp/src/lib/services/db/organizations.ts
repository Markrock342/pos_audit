import { getDb } from "@/lib/db/supabase";
import type { Organization } from "@/types";

const TABLE = "organizations";

export async function getOrganization(id: string): Promise<Organization | null> {
  const { data, error } = await getDb()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as Organization;
}

export async function getOrganizations(): Promise<Organization[]> {
  const { data, error } = await getDb().from(TABLE).select("*");
  if (error || !data) return [];
  return data as Organization[];
}

export async function createOrganization(
  data: Omit<Organization, "id" | "createdAt">
): Promise<Organization> {
  const org = {
    ...data,
    created_at: new Date().toISOString(),
  };
  const { data: inserted, error } = await getDb()
    .from(TABLE)
    .insert(org)
    .select()
    .single();
  if (error) throw error;
  return inserted as Organization;
}

export async function updateOrganization(
  id: string,
  data: Partial<Omit<Organization, "id" | "createdAt">>
): Promise<Organization> {
  const { data: updated, error } = await getDb()
    .from(TABLE)
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return updated as Organization;
}

export async function deleteOrganization(id: string): Promise<void> {
  const { error } = await getDb().from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
