/** Service thống kê phiếu: số liệu biểu đồ → giữ DTO; kèm hook React Query */
import { useQuery } from '@tanstack/react-query';
import { worksheetStatsRepository } from '@/features/worksheet-stats/api/worksheetStatsRepository';
import type { QueryParams } from '@/shared/api/client';
import { qk } from '@/shared/api/queryKeys';

const api = {
  assignment: (id: string) => worksheetStatsRepository.assignment(id),
  classOverview: (classId: string, query: QueryParams) =>
    worksheetStatsRepository.classOverview(classId, query),
  student: (studentId: string) => worksheetStatsRepository.student(studentId),
  assignmentResultsXlsx: (assignmentId: string) =>
    worksheetStatsRepository.assignmentResultsXlsx(assignmentId),
};

export const WorksheetStatsService = {
  ...api,

  useAssignment: (id: string | undefined) =>
    useQuery({
      queryKey: qk.worksheetStats.assignment(id ?? ''),
      queryFn: () => api.assignment(id!),
      enabled: !!id,
    }),

  useClassOverview: (classId: string | undefined, params: QueryParams) =>
    useQuery({
      queryKey: qk.worksheetStats.classOverview(classId ?? '', params),
      queryFn: () => api.classOverview(classId!, params),
      enabled: !!classId,
    }),

  useStudent: (studentId: string | undefined) =>
    useQuery({
      queryKey: qk.worksheetStats.student(studentId ?? ''),
      queryFn: () => api.student(studentId!),
      enabled: !!studentId,
    }),
};
