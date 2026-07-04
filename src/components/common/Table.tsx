import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  rowClassName?: (item: T) => string;
  onRowClick?: (item: T) => void;
}

export function Table<T>({ data, columns, keyExtractor, emptyMessage = 'No data', rowClassName, onRowClick }: TableProps<T>) {
  if (data.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] dark:border-gray-800">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-900 border-b border-[var(--color-border)] dark:border-gray-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)] dark:divide-gray-800">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick && onRowClick(item)}
              className={`bg-white dark:bg-gray-900/50 transition-colors duration-100 ${
                rowClassName ? rowClassName(item) : ''
              } ${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'}`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300"
                >
                  {col.render
                    ? col.render(item)
                    : (item as Record<string, unknown>)[col.key] as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
