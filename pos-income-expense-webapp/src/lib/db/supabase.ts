/**
 * Supabase placeholder — configure when connecting to Supabase.
 * Docs: https://supabase.com/docs
 */
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export async function getSupabaseClient() {
  // TODO: create and return Supabase client
  throw new Error("Supabase not configured. Set env vars and implement getSupabaseClient.");
}
