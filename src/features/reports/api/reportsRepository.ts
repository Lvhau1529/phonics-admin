/**
 * Repository báo cáo: chỉ khai báo endpoint tải file (xlsx / pdf); trả `{ blob, filename }` như server gửi.
 */
import { ENDPOINTS, type ReportFormat } from '@phonics/contracts';
import { downloadFile, type QueryParams } from '@/shared/api/client';

export const reportsRepository = {
  /** Xếp hạng lớp: xlsx hoặc pdf */
  classRanking: (classId: string, format: ReportFormat, query: QueryParams) =>
    downloadFile(ENDPOINTS.reports.classRanking(classId, format), query, `ranking.${format}`),
  /** Sổ điểm lớp (xlsx) */
  classPoints: (classId: string, query: QueryParams) =>
    downloadFile(ENDPOINTS.reports.classPoints(classId), query, 'points.xlsx'),
};
