export type DataSource = "supabase" | "mock";

export const DATA_SOURCE_KEY = "app-data-source";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function getClientDataSource(): DataSource {
  if (typeof window === "undefined") return "supabase";
  return localStorage.getItem(DATA_SOURCE_KEY) === "mock" ? "mock" : "supabase";
}

export function setClientDataSource(source: DataSource) {
  localStorage.setItem(DATA_SOURCE_KEY, source);
  document.cookie = `${DATA_SOURCE_KEY}=${source};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
  window.dispatchEvent(new CustomEvent("data-source-change", { detail: source }));
}

export async function getServerDataSource(): Promise<DataSource> {
  const { cookies } = await import("next/headers");
  const value = (await cookies()).get(DATA_SOURCE_KEY)?.value;
  return value === "mock" ? "mock" : "supabase";
}
