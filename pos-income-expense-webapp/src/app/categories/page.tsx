"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { addCategory, deleteCategory, getCategories } from "@/lib/store";
import type { Category } from "@/types";
import { Trash2 } from "lucide-react";

const PRESET_COLORS = [
  "#8B5E3C",
  "#D4A574",
  "#6B8E23",
  "#B22222",
  "#4682B4",
  "#708090",
  "#F5A623",
  "#7B68EE",
  "#2E8B57",
  "#FF6B6B",
  "#4ECDC4",
  "#8E44AD",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(getCategories());
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");
  const [selectedColor, setSelectedColor] = useState("#8B5E3C");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = () => setCategories(getCategories());

  const handleAdd = () => {
    if (!name.trim()) return;
    addCategory({ name: name.trim(), type, color: selectedColor });
    setName("");
    setType("income");
    setSelectedColor("#8B5E3C");
    refresh();
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteCategory(deletingId);
      refresh();
    }
    setDeletingId(null);
    setDialogOpen(false);
  };

  const columns = [
    {
      key: "name",
      header: "ชื่อหมวดหมู่",
      render: (row: Category) => (
        <span className="inline-flex items-center gap-2 font-medium">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: row.color }}
          />
          {row.name}
        </span>
      ),
    },
    {
      key: "type",
      header: "ประเภท",
      render: (row: Category) => (
        <span
          className={
            row.type === "income"
              ? "rounded-full bg-income-light px-2 py-0.5 text-xs text-income"
              : "rounded-full bg-expense-light px-2 py-0.5 text-xs text-expense"
          }
        >
          {row.type === "income" ? "รายรับ" : "รายจ่าย"}
        </span>
      ),
    },
    {
      key: "color",
      header: "สี",
      render: (row: Category) => (
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-5 w-5 rounded-full border border-border-default"
            style={{ backgroundColor: row.color }}
          />
          <code className="rounded bg-surface-hover px-2 py-1 text-xs text-text-secondary">
            {row.color}
          </code>
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-16",
      render: (row: Category) => (
        <button
          onClick={() => openDeleteDialog(row.id)}
          className="rounded-xl p-2 text-text-muted transition-colors hover:bg-error-light hover:text-error"
          aria-label="ลบหมวดหมู่"
        >
          <Trash2 size={20} />
        </button>
      ),
    },
  ];

  return (
    <AppLayout title="หมวดหมู่">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>รายการหมวดหมู่</CardTitle>
            <Button size="sm" variant="outline" onClick={refresh}>
              รีเฟรช
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={categories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>เพิ่มหมวดหมู่</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="ชื่อหมวดหมู่"
                placeholder="เช่น วัสดุก่อสร้าง"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Select
                label="ประเภท"
                options={[
                  { value: "income", label: "รายรับ" },
                  { value: "expense", label: "รายจ่าย" },
                ]}
                value={type}
                onChange={(e) => setType(e.target.value as "income" | "expense")}
              />
              <div>
                <label className="mb-2 block text-base font-medium text-text-secondary">
                  เลือกสี
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`flex items-center justify-center rounded-full border-2 transition-all ${
                        selectedColor === color
                          ? "border-text-main scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`เลือกสี ${color}`}
                    >
                      <span className="h-8 w-8 rounded-full" />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-text-muted">
                  สีที่เลือก: <span className="font-mono">{selectedColor}</span>
                </p>
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={!name.trim()}>
                บันทึกหมวดหมู่
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={dialogOpen}
        title="ยืนยันการลบ"
        message="คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDialogOpen(false);
          setDeletingId(null);
        }}
      />
    </AppLayout>
  );
}
