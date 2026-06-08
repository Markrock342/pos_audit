/** แยกชื่อหมวดหมู่สั้น/คำอธิบาย จากชื่อใน DB เช่น "ค่าสินค้า (ขายวัสดุ)" */
export function splitCategoryName(name: string): { label: string; hint?: string } {
  const trimmed = name.trim();
  const open = trimmed.indexOf("(");
  if (open === -1) return { label: trimmed };
  const close = trimmed.indexOf(")", open);
  if (close === -1) return { label: trimmed };
  const label = trimmed.slice(0, open).trim();
  const hint = trimmed.slice(open + 1, close).trim();
  return { label: label || trimmed, hint: hint || undefined };
}
