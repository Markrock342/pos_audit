import { cn } from "@/lib/utils/cn";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function DataTable<T extends object>({
  columns,
  data,
  emptyMessage = "ไม่มีข้อมูล",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border-default py-16 text-center text-base text-text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border-2 border-border-default">
      <table className="w-full min-w-[600px] text-left text-lg">
        <thead className="bg-surface-inset text-text-secondary">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={cn("px-5 py-5 font-semibold", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {data.map((row, idx) => (
            <tr key={idx} className="">
              {columns.map((col) => (
                <td key={col.key} className={cn("px-5 py-5 text-text-main", col.className)}>
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
