import { getDb } from "@/lib/db/supabase";
import type { User } from "@/types";

const TABLE = "users";

export async function getUser(id: string): Promise<User | null> {
  const { data, error } = await getDb()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as User;
}

export async function getUsers(organizationId?: string): Promise<User[]> {
  let q = getDb().from(TABLE).select("*");
  if (organizationId) {
    q = q.eq("organization_id", organizationId);
  }
  const { data, error } = await q;
  if (error || !data) return [];
  return data as User[];
}

export async function createUser(data: Omit<User, "id">): Promise<User> {
  const { data: inserted, error } = await getDb()
    .from(TABLE)
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return inserted as User;
}

export async function updateUser(
  id: string,
  data: Partial<Omit<User, "id">>
): Promise<User> {
  const { data: updated, error } = await getDb()
    .from(TABLE)
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return updated as User;
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await getDb().from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
