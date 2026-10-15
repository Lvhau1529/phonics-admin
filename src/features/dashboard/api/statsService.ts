/**
 * Service thống kê: số liệu tổng / biểu đồ không cần model (không có hành vi riêng) → trả thẳng DTO đã parse.
 * Vẫn đi qua service (kèm hook React Query) để trang không phụ thuộc repository.
 */
import { useQuery } from '@tanstack/react-query';
import { statsRepository } from '@/features/dashboard/api/statsRepository';
import type { QueryParams } from '@/shared/api/client';
import { qk } from '@/shared/api/queryKeys';

const api = {
  overview: () => statsRepository.overview(),
  classTimeline: (classId: string, query: QueryParams) => statsRepository.classTimeline(classId, query),
  classTopStudents: (classId: string, query: QueryParams) => statsRepository.classTopStudents(classId, query),
  classGames: (classId: string, query: QueryParams) => statsRepository.classGames(classId, query),
};

export const StatsService = {
  ...api,

  useOverview: () => useQuery({ queryKey: qk.stats.overview, queryFn: api.overview }),

  useClassTimeline: (classId: string | undefined, params: QueryParams) =>
    useQuery({
      queryKey: qk.stats.classTimeline(classId ?? '', params),
      queryFn: () => api.classTimeline(classId!, params),
      enabled: !!classId,
    }),

  useClassTopStudents: (classId: string | undefined, params: QueryParams) =>
    useQuery({
      queryKey: qk.stats.classTopStudents(classId ?? '', params),
      queryFn: () => api.classTopStudents(classId!, params),
      enabled: !!classId,
    }),

  useClassGames: (classId: string | undefined, params: QueryParams) =>
    useQuery({
      queryKey: qk.stats.classGames(classId ?? '', params),
      queryFn: () => api.classGames(classId!, params),
      enabled: !!classId,
    }),
};
