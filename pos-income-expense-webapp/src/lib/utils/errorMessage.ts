/** ดึงข้อความ error จาก Supabase / Error / unknown */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const msg = String((err as { message: unknown }).message);
    if (msg) return msg;
  }
  return fallback;
}
