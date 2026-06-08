import { getDb } from "@/lib/db/supabase";
import { mapCategory, toCategoryInsert } from "@/lib/utils/dbMap";
import type { Category } from "@/types";

const TABLE = "categories";

export async function getCategory(id: string): Promise<Category | null> {
  const { data, error } = await getDb()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapCategory(data as Record<string, unknown>);
}

export async function getCategories(
  organizationId: string,
  type?: "income" | "expense"
): Promise<Category[]> {
  let q = getDb().from(TABLE).select("*").eq("organization_id", organizationId).order("sort_order", { ascending: true });
  if (type) {
    q = q.eq("type", type);
  }
  const { data, error } = await q;
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapCategory);
}

export async function createCategory(
  data: Omit<Category, "id" | "createdAt">
): Promise<Category> {
  const { data: inserted, error } = await getDb()
    .from(TABLE)
    .insert(toCategoryInsert(data))
    .select()
    .single();
  if (error) throw error;
  return mapCategory(inserted as Record<string, unknown>);
}

export async function updateCategory(
  id: string,
  data: Partial<Omit<Category, "id" | "createdAt">>
): Promise<Category> {
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.type !== undefined) patch.type = data.type;
  if (data.color !== undefined) patch.color = data.color;
  if (data.sortOrder !== undefined) patch.sort_order = data.sortOrder;
  if (data.isActive !== undefined) patch.is_active = data.isActive;
  const { data: updated, error } = await getDb()
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapCategory(updated as Record<string, unknown>);
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await getDb().from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
