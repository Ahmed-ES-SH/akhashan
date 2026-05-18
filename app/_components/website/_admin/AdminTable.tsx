"use client";

import { ReactNode } from "react";
import { useTranslation } from "@/app/hooks/useTranslation";

///////////////////////////////////////////////////////////////////////
/////////////// Admin Table — single reusable component ///////////////
///////////////////////////////////////////////////////////////////////

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface AdminTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  rowKey?: (item: T) => string | number;
}

export function AdminTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  emptyMessage,
  onRowClick,
  rowKey,
}: AdminTableProps<T>) {
  const t = useTranslation("admin");

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        {emptyMessage ?? t.common.table.noData}
      </div>
    );
  }

  function getKey(item: T, index: number): string | number {
    if (rowKey) return rowKey(item);
    return (item.id as string | number) ?? index;
  }

  return (
    <div className="overflow-x-auto">
      <table data-testid="admin-table" className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={getKey(item, index)}
              onClick={() => onRowClick?.(item)}
              className={`border-b border-gray-100 transition hover:bg-gray-50 ${onRowClick ? "cursor-pointer" : ""}`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-sm text-gray-900 ${col.className ?? ""}`}
                >
                  {col.render ? col.render(item) : (item[col.key] as ReactNode) ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
