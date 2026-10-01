import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { useTableQuery } from '@/shared/hooks/useTableQuery';

/** Hook test + vị trí hiện tại để kiểm tra URL */
function useHarness() {
  const table = useTableQuery({ filterKeys: ['status', 'classId'] as const, defaultSort: 'createdAt:desc' });
  const location = useLocation();
  return { table, search: location.search };
}

const wrapper =
  (initial: string) =>
  ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
  );

describe('useTableQuery', () => {
  it('đọc page / pageSize / sort / q / filter từ URL, mặc định khi thiếu', () => {
    const { result } = renderHook(useHarness, {
      wrapper: wrapper('/x?page=3&pageSize=50&q=an&status=ACTIVE'),
    });
    expect(result.current.table.params).toEqual({
      page: 3,
      pageSize: 50,
      sort: 'createdAt:desc',
      q: 'an',
      status: 'ACTIVE',
      classId: undefined,
    });
  });

  it('đổi trang / sort ghi lên URL; giá trị mặc định bị xoá khỏi URL', () => {
    const { result } = renderHook(useHarness, { wrapper: wrapper('/x') });
    act(() => result.current.table.setPage(2, 50));
    expect(result.current.search).toBe('?page=2&pageSize=50');
    act(() => result.current.table.setSort('name:asc'));
    expect(result.current.search).toBe('?pageSize=50&sort=name%3Aasc');
    // sort về mặc định → xoá; page về 1 → xoá
    act(() => result.current.table.setSort('createdAt:desc'));
    expect(result.current.search).toBe('?pageSize=50');
  });

  it('đổi q / filter thì về trang 1 và giữ các tham số khác', () => {
    const { result } = renderHook(useHarness, { wrapper: wrapper('/x?page=4&classId=abc') });
    act(() => result.current.table.setQ('  bé  '));
    expect(result.current.table.page).toBe(1);
    expect(result.current.table.q).toBe('bé');
    expect(result.current.table.filters.classId).toBe('abc');
    act(() => result.current.table.setFilter('status', 'DISABLED'));
    expect(result.current.table.filters).toEqual({ status: 'DISABLED', classId: 'abc' });
    act(() => result.current.table.setFilter('classId', undefined));
    expect(result.current.search).toBe('?q=b%C3%A9&status=DISABLED');
  });

  it('reset xoá mọi tham số', () => {
    const { result } = renderHook(useHarness, { wrapper: wrapper('/x?page=2&q=a&status=ACTIVE') });
    act(() => result.current.table.reset());
    expect(result.current.search).toBe('');
    expect(result.current.table.params.page).toBe(1);
  });
});
