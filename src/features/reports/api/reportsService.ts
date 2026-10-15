/** Service báo cáo: file tải về không cần model → chuyển tiếp `reportsRepository` (không có hook: gọi khi bấm nút) */
import type { ReportFormat } from '@phonics/contracts';
import { reportsRepository } from '@/features/reports/api/reportsRepository';
import type { QueryParams } from '@/shared/api/client';

export const ReportsService = {
  classRanking: (classId: string, format: ReportFormat, query: QueryParams) =>
    reportsRepository.classRanking(classId, format, query),
  classPoints: (classId: string, query: QueryParams) => reportsRepository.classPoints(classId, query),
};
