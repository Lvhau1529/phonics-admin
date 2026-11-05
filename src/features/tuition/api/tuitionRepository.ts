/**
 * Repository học phí: thống kê tạm tính (`ENDPOINTS.attendance.tuitionOverview` ADMIN + `ENDPOINTS.students.tuition`),
 * phiếu báo học phí PDF (`ENDPOINTS.students.tuitionStatement`), thông báo học phí qua Zalo
 * (`ENDPOINTS.attendance.tuitionNotices`), cài đặt phiếu (`ENDPOINTS.admin.tuitionSettings`).
 */
import {
  ENDPOINTS,
  StudentTuitionResponse,
  TuitionNoticesResponse,
  TuitionOverview,
  TuitionSettings,
  type TuitionNoticeQuery,
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
  /** Dữ liệu soạn tin nhắn thông báo học phí từng phụ huynh (Zalo) */
  notices: (query: TuitionNoticeQuery) =>
    request(ENDPOINTS.attendance.tuitionNotices, { query, schema: TuitionNoticesResponse }),
  settings: () => request(ENDPOINTS.admin.tuitionSettings, { schema: TuitionSettings }),
  updateSettings: (body: UpdateTuitionSettings) =>
    request(ENDPOINTS.admin.tuitionSettings, { method: 'PUT', body, schema: TuitionSettings }),
};
