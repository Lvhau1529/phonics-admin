/** Service báo cáo: file tải về không cần model → chuyển tiếp `reportsRepository` */
import type { ReportFormat } from '@phonics/contracts';
import { reportsRepository } from '@/features/reports/api/reportsRepository';
import type { QueryParams } from '@/shared/api/client';

export const reportsService = {
  classRanking: (classId: string, format: ReportFormat, query: QueryParams) =>
    reportsRepository.classRanking(classId, format, query),
  classPoints: (classId: string, query: QueryParams) => reportsRepository.classPoints(classId, query),
};
