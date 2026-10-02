import type { Paginated } from '@phonics/contracts';

/** Đổi từng item của trang (DTO → model) — giữ nguyên total / page / pageSize */
export const mapPage = <T, R>(page: Paginated<T>, map: (item: T) => R): Paginated<R> => ({
  ...page,
  items: page.items.map(map),
});
