import { ReactNode, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string | (() => ReactNode);
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  isLoading?: boolean;
  /** Paginação controlada pela página (desliga a paginação interna). */
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  /** Desliga a paginação interna (ex.: impressão/PDF, onde tudo deve aparecer). */
  paginate?: boolean;
  /** Tamanho inicial da página quando a paginação é interna. */
  pageSize?: number;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250];

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'Nenhum dado encontrado',
  isLoading,
  pagination,
  paginate = true,
  pageSize: initialPageSize = 50,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(initialPageSize);

  const internalPagination = paginate && !pagination;
  const total = data.length;
  const perPage = pageSize === 'all' ? Math.max(total, 1) : pageSize;
  const totalPages = internalPagination ? Math.max(1, Math.ceil(total / perPage)) : 1;
  const currentPage = Math.min(page, totalPages);

  // Ao mudar filtros/consulta (muda o total), volta para a primeira página.
  useEffect(() => {
    setPage(1);
  }, [total]);

  const visibleData = useMemo(() => {
    if (!internalPagination) return data;
    const start = (currentPage - 1) * perPage;
    return data.slice(start, start + perPage);
  }, [data, internalPagination, currentPage, perPage]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="animate-pulse p-8">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="table-header">
              {columns.map((col) => (
                <th 
                  key={col.key} 
                  className={cn("px-4 py-3 text-left", col.className)}
                >
                  {typeof col.header === 'function' ? col.header() : col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={keyExtractor(item)} className="table-row">
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3", col.className)}>
                      {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Página {pagination.currentPage} de {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
