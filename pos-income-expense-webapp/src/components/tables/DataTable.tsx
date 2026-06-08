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
  getRowKey?: (row: T, index: number) => string;
  isRowSelected?: (row: T) => boolean;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
}

export function DataTable<T extends object>({
  columns,
  data,
  emptyMessage = "ไม่มีข้อมูล",
  getRowKey,
  isRowSelected,
  onRowClick,
  stickyHeader,
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
      <table className="w-full text-left text-lg">
        <thead
          className={cn(
            "bg-surface-inset text-text-secondary",
            stickyHeader && "sticky top-0 z-10 border-b border-border-default"
          )}
        >
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={cn("px-5 py-5 font-semibold", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {data.map((row, idx) => {
            const selected = isRowSelected?.(row) ?? false;
            return (
            <tr
              key={getRowKey?.(row, idx) ?? idx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                onRowClick && "cursor-pointer hover:bg-surface-hover/60",
                selected && "bg-income-light/40 ring-1 ring-inset ring-income/30"
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-5 py-5 text-text-main", col.className)}>
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
