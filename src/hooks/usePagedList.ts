import { useEffect, useMemo, useState } from 'react';

export type PageSize = number | 'all';

export interface PagedList<T> {
  items: T[];
  page: number;
  setPage: (page: number) => void;
  pageSize: PageSize;
  setPageSize: (size: PageSize) => void;
  totalItems: number;
  totalPages: number;
  from: number;
  to: number;
}

/**
 * Pagina uma lista já filtrada, renderizando apenas a página atual.
 * Ao mudar o total (novos filtros/consulta), volta para a primeira página.
 */
export function usePagedList<T>(data: T[], initialPageSize: PageSize = 50): PagedList<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(initialPageSize);

  const totalItems = data.length;
  const perPage = pageSize === 'all' ? Math.max(totalItems, 1) : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [totalItems]);

  const items = useMemo(() => {
    if (pageSize === 'all') return data;
    const start = (currentPage - 1) * perPage;
    return data.slice(start, start + perPage);
  }, [data, pageSize, currentPage, perPage]);

  return {
    items,
    page: currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    from: totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1,
    to: Math.min(currentPage * perPage, totalItems),
  };
}

export default usePagedList;
