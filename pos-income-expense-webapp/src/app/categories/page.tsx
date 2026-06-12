"use client";

import { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import {
  createCategoryApi,
  deleteCategoryApi,
  fetchCategories,
  updateCategoryApi,
} from "@/lib/api/client";
import type { Category } from "@/types";
import { Pencil, Trash2, X } from "lucide-react";

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");
  const [selectedColor, setSelectedColor] = useState("#8B5E3C");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setType("income");
    setSelectedColor("#8B5E3C");
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await fetchCategories());
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดหมวดหมู่ไม่สำเร็จ");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setType(cat.type);
    setSelectedColor(cat.color);
    setError(null);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateCategoryApi(editingId, {
          name: name.trim(),
          type,
          color: selectedColor,
        });
      } else {
        await createCategoryApi({
          name: name.trim(),
          type,
          color: selectedColor,
        });
      }
      resetForm();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกหมวดหมู่ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteCategoryApi(deletingId);
      if (editingId === deletingId) resetForm();
      setDialogOpen(false);
      setDeletingId(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบหมวดหมู่ไม่สำเร็จ — อาจมีรายการที่ใช้หมวดนี้อยู่");
    } finally {
      setDeleting(false);
    }
  };

  const deletingCat = deletingId
    ? categories.find((c) => c.id === deletingId)
    : null;

  const columns = [
    {
      key: "name",
      header: "ชื่อหมวดหมู่",
      render: (row: Category) => (
        <span className="inline-flex items-center gap-2 font-medium">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: row.color }}
          />
          {row.name}
        </span>
      ),
    },
    {
      key: "type",
      header: "ประเภท",
      className: "whitespace-nowrap",
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
      className: "hidden md:table-cell",
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
      header: "จัดการ",
      className: "w-28 text-right",
      render: (row: Category) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => startEdit(row)}
            className={`touch-target rounded-xl p-3 transition-colors hover:bg-surface-hover hover:text-brand ${
              editingId === row.id ? "bg-brand/10 text-brand" : "text-text-muted"
            }`}
            aria-label={`แก้ไข ${row.name}`}
            title="แก้ไข"
          >
            <Pencil size={22} />
          </button>
          <button
            type="button"
            onClick={() => openDeleteDialog(row.id)}
            className="touch-target rounded-xl p-3 text-text-muted transition-colors hover:bg-error-light hover:text-error"
            aria-label={`ลบ ${row.name}`}
            title="ลบ"
          >
            <Trash2 size={22} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout title="หมวดหมู่">
      <div className="flex flex-col gap-4 2xl:h-[calc(100vh-8rem)] 2xl:max-h-[calc(100vh-8rem)] 2xl:overflow-hidden">
        {error && (
          <p className="shrink-0 rounded-xl bg-error-light px-4 py-3 text-sm font-bold text-error">
            {error}
          </p>
        )}

        <div className="grid min-h-0 flex-1 gap-6 overflow-hidden 2xl:grid-cols-3 2xl:items-stretch">
          <Card className="flex min-h-[400px] flex-col overflow-hidden 2xl:col-span-2 2xl:min-h-0">
            <CardHeader className="flex shrink-0 flex-row items-center justify-between">
              <CardTitle>รายการหมวดหมู่</CardTitle>
              <Button size="sm" variant="outline" onClick={refresh} disabled={loading} className="tablet-touch-chip">
                รีเฟรช
              </Button>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {loading ? (
                <p className="py-8 text-center text-text-muted">กำลังโหลด...</p>
              ) : (
                <>
                  <div className="space-y-3 2xl:hidden">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className={`rounded-2xl border-2 bg-surface-elevated p-4 ${
                          editingId === cat.id ? "border-brand bg-brand/5" : "border-border-default"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className="h-5 w-5 shrink-0 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-base font-bold text-text-main">{cat.name}</p>
                              <span
                                className={
                                  cat.type === "income"
                                    ? "mt-1 inline-block rounded-full bg-income-light px-2 py-0.5 text-xs font-bold text-income"
                                    : "mt-1 inline-block rounded-full bg-expense-light px-2 py-0.5 text-xs font-bold text-expense"
                                }
                              >
                                {cat.type === "income" ? "รายรับ" : "รายจ่าย"}
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(cat)}
                              className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-xl bg-surface-hover text-brand active:scale-95"
                              aria-label={`แก้ไข ${cat.name}`}
                            >
                              <Pencil size={22} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteDialog(cat.id)}
                              className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-xl bg-expense-light text-expense active:scale-95"
                              aria-label={`ลบ ${cat.name}`}
                            >
                              <Trash2 size={22} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden 2xl:block">
                    <DataTable columns={columns} data={categories} stickyHeader />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="flex min-h-0 flex-col overflow-hidden 2xl:col-span-1 2xl:h-full">
            <CardHeader className="flex shrink-0 flex-row items-center justify-between">
            <CardTitle>{editingId ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</CardTitle>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl p-2 text-text-muted hover:bg-surface-hover"
                aria-label="ยกเลิกแก้ไข"
              >
                <X size={20} />
              </button>
            )}
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`flex min-h-[52px] min-w-[52px] items-center justify-center rounded-full border-2 transition-all active:scale-95 ${
                        selectedColor === color
                          ? "border-text-main scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`เลือกสี ${color}`}
                    >
                      <span className="h-10 w-10 rounded-full 2xl:h-8 2xl:w-8" />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-text-muted">
                  สีที่เลือก: <span className="font-mono">{selectedColor}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={!name.trim() || saving}
                >
                  {saving
                    ? "กำลังบันทึก..."
                    : editingId
                      ? "บันทึกการแก้ไข"
                      : "บันทึกหมวดหมู่"}
                </Button>
                {editingId && (
                  <Button className="flex-1" variant="outline" onClick={resetForm}>
                    ยกเลิก
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        title="ลบหมวดหมู่นี้?"
        message={
          deletingCat
            ? `ลบ "${deletingCat.name}" — ถ้ามีรายการที่ใช้หมวดนี้อยู่จะลบไม่ได้`
            : "ลบหมวดหมู่นี้? ถ้ามีรายการที่ใช้หมวดนี้อยู่จะลบไม่ได้"
        }
        confirmLabel={deleting ? "กำลังลบ..." : "ลบ"}
        cancelLabel="ยกเลิก"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) {
            setDialogOpen(false);
            setDeletingId(null);
          }
        }}
      />
    </AppLayout>
  );
}
