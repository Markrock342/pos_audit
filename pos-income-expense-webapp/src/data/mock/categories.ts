import type { Category } from "@/types";

export const mockCategories: Category[] = [
  { id: "cat-1", organizationId: "default-org", name: "รายได้ขาย", type: "income", color: "#4CAF50", sortOrder: 10, isActive: true, createdAt: "2026-06-01T00:00:00.000Z" },
  { id: "cat-2", organizationId: "default-org", name: "รายได้อื่น", type: "income", color: "#2196F3", sortOrder: 20, isActive: true, createdAt: "2026-06-01T00:00:00.000Z" },
  { id: "cat-3", organizationId: "default-org", name: "ดอกเบี้ยรับ", type: "income", color: "#FF9800", sortOrder: 30, isActive: true, createdAt: "2026-06-01T00:00:00.000Z" },
  { id: "cat-4", organizationId: "default-org", name: "ค่าเช่า", type: "expense", color: "#B22222", sortOrder: 10, isActive: true, createdAt: "2026-06-01T00:00:00.000Z" },
  { id: "cat-5", organizationId: "default-org", name: "วัสดุสำนักงาน", type: "expense", color: "#6B8E23", sortOrder: 20, isActive: true, createdAt: "2026-06-01T00:00:00.000Z" },
  { id: "cat-6", organizationId: "default-org", name: "ค่าน้ำ-ค่าไฟ", type: "expense", color: "#4682B4", sortOrder: 30, isActive: true, createdAt: "2026-06-01T00:00:00.000Z" },
  { id: "cat-7", organizationId: "default-org", name: "ค่าใช้จ่ายอื่น", type: "expense", color: "#708090", sortOrder: 40, isActive: true, createdAt: "2026-06-01T00:00:00.000Z" },
];
