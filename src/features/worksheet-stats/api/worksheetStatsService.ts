/** Service thống kê phiếu: số liệu biểu đồ → giữ DTO */
import { worksheetStatsRepository } from '@/features/worksheet-stats/api/worksheetStatsRepository';
import type { QueryParams } from '@/shared/api/client';

export const worksheetStatsService = {
  assignment: (id: string) => worksheetStatsRepository.assignment(id),
  classOverview: (classId: string, query: QueryParams) =>
    worksheetStatsRepository.classOverview(classId, query),
  student: (studentId: string) => worksheetStatsRepository.student(studentId),
  assignmentResultsXlsx: (assignmentId: string) =>
    worksheetStatsRepository.assignmentResultsXlsx(assignmentId),
};
