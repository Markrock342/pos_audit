import { AppLayout } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/tables/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { mockCategories } from "@/data/mock";
import type { Category } from "@/types";

export default function CategoriesPage() {
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
              ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800"
              : "rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800"
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
        <code className="rounded bg-stone-100 px-2 py-1 text-xs">{row.color}</code>
      ),
    },
  ];

  return (
    <AppLayout title="หมวดหมู่">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>รายการหมวดหมู่</CardTitle>
            <Button size="sm" variant="outline">
              รีเฟรช
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={mockCategories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>เพิ่มหมวดหมู่ (Mock)</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <Input label="ชื่อหมวดหมู่" placeholder="เช่น เครื่องดื่ม" />
              <Select
                label="ประเภท"
                options={[
                  { value: "income", label: "รายรับ" },
                  { value: "expense", label: "รายจ่าย" },
                ]}
                defaultValue="income"
              />
              <Input label="สี (Hex)" placeholder="#8B5E3C" defaultValue="#8B5E3C" />
              <Button type="button" className="w-full">
                บันทึกหมวดหมู่
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
