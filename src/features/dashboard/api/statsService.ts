/**
 * Service thống kê: số liệu tổng / biểu đồ không cần model (không có hành vi riêng) → trả thẳng DTO đã parse.
 * Vẫn đi qua service để hook / trang không phụ thuộc repository.
 */
import { statsRepository } from '@/features/dashboard/api/statsRepository';
import type { QueryParams } from '@/shared/api/client';

export const statsService = {
  overview: () => statsRepository.overview(),
  classTimeline: (classId: string, query: QueryParams) => statsRepository.classTimeline(classId, query),
  classTopStudents: (classId: string, query: QueryParams) => statsRepository.classTopStudents(classId, query),
  classGames: (classId: string, query: QueryParams) => statsRepository.classGames(classId, query),
};
