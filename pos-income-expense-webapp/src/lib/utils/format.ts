export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** ยอดถอนเงิน — ใส่ − เฉพาะเมื่อมียอดจริง (0 แสดง ฿0 ไม่ใช่ −฿0) */
export function formatWithdrawalAmount(amount: number): string {
  if (amount <= 0) return formatCurrency(0);
  return `−${formatCurrency(amount)}`;
}

function toValidDate(date: string | undefined | null): Date | null {
  if (!date) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00` : date;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(date: string): string {
  return formatDateTime(date);
}

/** วันที่ + เวลา (ชม.:นาที) */
export function formatDateTime(date: string): string {
  const parsed = toValidDate(date);
  if (!parsed) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

/** เวลาอัปเดตแบบ relative — ใช้กับ component ที่ refresh เป็นระยะ */
export function formatRelativeTime(date: string, now = new Date()): string {
  const parsed = toValidDate(date);
  if (!parsed) return "-";

  const diffSec = Math.floor((now.getTime() - parsed.getTime()) / 1000);
  if (diffSec < 0) return "เมื่อสักครู่";
  if (diffSec < 10) return "เมื่อสักครู่";
  if (diffSec < 60) return `${diffSec} วินาทีที่แล้ว`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
  return formatDateTime(date);
}

export function formatDateShort(date: string): string {
  const parsed = toValidDate(date);
  if (!parsed) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
}
