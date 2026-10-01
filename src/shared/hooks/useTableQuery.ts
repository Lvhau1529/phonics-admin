/**
 * Trạng thái bảng (trang, cỡ trang, sort, tìm kiếm, bộ lọc) đồng bộ với URL search params:
 * F5 / chia sẻ link giữ nguyên bộ lọc. Đổi q / filter thì về trang 1.
 */
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { DEFAULT_PAGE_SIZE } from '@/shared/config';

export interface TableQueryOptions<F extends string> {
  /** Tên các bộ lọc thêm (classId, status...) — mỗi tên là một search param */
  filterKeys?: readonly F[];
  defaultPageSize?: number;
  /** `field:asc|desc` khi URL không có sort */
  defaultSort?: string;
}

export type TableQueryParams<F extends string> = {
  page: number;
  pageSize: number;
  sort?: string;
  q?: string;
} & Record<F, string | undefined>;

export interface TableQuery<F extends string> {
  page: number;
  pageSize: number;
  sort: string | undefined;
  q: string | undefined;
  filters: Record<F, string | undefined>;
  /** Tham số gửi API (undefined bị client bỏ qua) */
  params: TableQueryParams<F>;
  setPage: (page: number, pageSize?: number) => void;
  setSort: (sort: string | undefined) => void;
  setQ: (q: string | undefined) => void;
  setFilter: (key: F, value: string | undefined) => void;
  reset: () => void;
}

type Patch = Record<string, string | number | undefined>;

export function useTableQuery<F extends string = never>(options: TableQueryOptions<F> = {}): TableQuery<F> {
  const { filterKeys = [] as readonly F[], defaultPageSize = DEFAULT_PAGE_SIZE, defaultSort } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Math.max(1, Number(searchParams.get('pageSize')) || defaultPageSize);
  const sort = searchParams.get('sort') ?? defaultSort;
  const q = searchParams.get('q') ?? undefined;

  const filterSignature = filterKeys.map((key) => `${key}=${searchParams.get(key) ?? ''}`).join('&');
  const filters = useMemo(() => {
    const out = {} as Record<F, string | undefined>;
    for (const key of filterKeys) out[key] = searchParams.get(key) ?? undefined;
    return out;
    // filterSignature đại diện cho mọi giá trị filter trên URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSignature]);

  /** Ghi một phần tham số lên URL; giá trị undefined / mặc định bị xoá */
  const update = useCallback(
    (patch: Patch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            const isDefault =
              value === undefined ||
              value === '' ||
              (key === 'page' && value === 1) ||
              (key === 'pageSize' && value === defaultPageSize) ||
              (key === 'sort' && value === defaultSort);
            if (isDefault) next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, defaultPageSize, defaultSort],
  );

  const setPage = useCallback(
    (nextPage: number, nextPageSize?: number) =>
      update({ page: nextPage, ...(nextPageSize !== undefined ? { pageSize: nextPageSize } : {}) }),
    [update],
  );
  const setSort = useCallback(
    (nextSort: string | undefined) => update({ sort: nextSort, page: 1 }),
    [update],
  );
  const setQ = useCallback(
    (nextQ: string | undefined) => update({ q: nextQ?.trim() || undefined, page: 1 }),
    [update],
  );
  const setFilter = useCallback(
    (key: F, value: string | undefined) => update({ [key]: value, page: 1 }),
    [update],
  );
  const reset = useCallback(
    () => setSearchParams(new URLSearchParams(), { replace: true }),
    [setSearchParams],
  );

  const params = useMemo(
    () => ({ page, pageSize, sort, q, ...filters }) as TableQueryParams<F>,
    [page, pageSize, sort, q, filters],
  );

  return { page, pageSize, sort, q, filters, params, setPage, setSort, setQ, setFilter, reset };
}
