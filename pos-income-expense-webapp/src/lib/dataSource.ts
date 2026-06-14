export type DataSource = "supabase";

/** ใช้ Supabase เท่านั้น — ไม่มี mock สำหรับส่งลูกค้า */
export function getClientDataSource(): DataSource {
  return "supabase";
}

export function setClientDataSource() {
  // no-op: production uses Supabase only
}

export async function getServerDataSource(): Promise<DataSource> {
  return "supabase";
}
