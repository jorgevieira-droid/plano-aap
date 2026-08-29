import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PagedList } from '@/hooks/usePagedList';

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250];

interface ListPaginationProps {
  paged: Pick<PagedList<unknown>, 'page' | 'setPage' | 'pageSize' | 'setPageSize' | 'totalItems' | 'totalPages' | 'from' | 'to'>;
  className?: string;
  itemLabel?: string;
}

/** Controles de paginação (contador, itens por página e navegação). */
export function ListPagination({ paged, className, itemLabel = 'registro(s)' }: ListPaginationProps) {
  const { page, setPage, pageSize, setPageSize, totalItems, totalPages, from, to } = paged;

  if (totalItems <= PAGE_SIZE_OPTIONS[0]) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 print:hidden',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          {pageSize === 'all' ? `${totalItems} ${itemLabel}` : `${from}–${to} de ${totalItems} ${itemLabel}`}
        </span>
        <select
          value={String(pageSize)}
          onChange={(e) => {
            const v = e.target.value;
            setPageSize(v === 'all' ? 'all' : Number(v));
            setPage(1);
          }}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
          aria-label="Itens por página"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n} por página</option>
          ))}
          <option value="all">Todos</option>
        </select>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="rounded-lg p-2 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Página anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="rounded-lg p-2 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Próxima página"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export default ListPagination;
