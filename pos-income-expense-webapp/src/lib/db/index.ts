/**
 * Database abstraction layer.
 * Switch provider by updating DB_PROVIDER and implementing the selected adapter.
 */
export type DbProvider = "firebase" | "supabase" | "postgres" | "mock";

export const DB_PROVIDER: DbProvider = "mock";

export { firebaseConfig } from "./firebase";
export { supabaseConfig } from "./supabase";
export { postgresConfig } from "./postgres";
