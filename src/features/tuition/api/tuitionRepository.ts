/**
 * Repository học phí: thống kê tạm tính (`ENDPOINTS.attendance.tuitionOverview` ADMIN + `ENDPOINTS.students.tuition`),
 * phiếu báo học phí PDF (`ENDPOINTS.students.tuitionStatement`), cài đặt phiếu (`ENDPOINTS.admin.tuitionSettings`).
 */
import {
  ENDPOINTS,
  StudentTuitionResponse,
  TuitionOverview,
  TuitionSettings,
  type TuitionQuery,
  type UpdateTuitionSettings,
} from '@phonics/contracts';
import { downloadFile, request } from '@/shared/api/client';

export const tuitionRepository = {
  overview: (query: TuitionQuery) =>
    request(ENDPOINTS.attendance.tuitionOverview, { query, schema: TuitionOverview }),
  student: (studentId: string, query: TuitionQuery) =>
    request(ENDPOINTS.students.tuition(studentId), { query, schema: StudentTuitionResponse }),
  /** PDF: tên file lấy từ Content-Disposition */
  statement: (studentId: string, month: string) =>
    downloadFile(ENDPOINTS.students.tuitionStatement(studentId), { month }, `hoc-phi-${month}.pdf`),
  settings: () => request(ENDPOINTS.admin.tuitionSettings, { schema: TuitionSettings }),
  updateSettings: (body: UpdateTuitionSettings) =>
    request(ENDPOINTS.admin.tuitionSettings, { method: 'PUT', body, schema: TuitionSettings }),
};
