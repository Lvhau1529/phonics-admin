/** Repository thống kê phiếu + xuất kết quả bài giao (xlsx) */
import {
  AssignmentStats,
  ClassWorksheetOverview,
  ENDPOINTS,
  StudentWorksheetStats,
} from '@phonics/contracts';
import { downloadFile, request, type QueryParams } from '@/shared/api/client';

export const worksheetStatsRepository = {
  assignment: (id: string) => request(ENDPOINTS.assignments.stats(id), { schema: AssignmentStats }),
  classOverview: (classId: string, query: QueryParams) =>
    request(ENDPOINTS.worksheetStats.classOverview(classId), { query, schema: ClassWorksheetOverview }),
  student: (studentId: string) =>
    request(ENDPOINTS.worksheetStats.student(studentId), { schema: StudentWorksheetStats }),
  assignmentResultsXlsx: (assignmentId: string) =>
    downloadFile(ENDPOINTS.reports.assignmentResults(assignmentId), undefined, 'results.xlsx'),
};
