/**
 * Repository điểm danh: chỉ khai báo endpoint (`ENDPOINTS.attendance`, `ENDPOINTS.students.attendance`) + schema
 * contracts, trả DTO đúng như BE. Trang duyệt nhanh qua mail gọi không kèm token (`auth: false`).
 */
import {
  AttendanceDigestView,
  AttendanceSessionDetail,
  AttendanceSessionSummary,
  CancelAttendanceSessionsResponse,
  ConfirmDigestResponse,
  ENDPOINTS,
  paginated,
  PendingCountResponse,
  StudentAttendanceResponse,
  type CancelAttendanceSessionsBody,
  type ConfirmDigestBody,
  type CreateAttendanceSessionBody,
  type UpdateAttendanceRecordsBody,
} from '@phonics/contracts';
import { HttpMethod, request, type QueryParams } from '@/shared/api/client';

const SessionPage = paginated(AttendanceSessionSummary);

export const attendanceRepository = {
  list: (query: QueryParams) => request(ENDPOINTS.attendance.sessions, { query, schema: SessionPage }),
  pendingCount: () => request(ENDPOINTS.attendance.pendingCount, { schema: PendingCountResponse }),
  detail: (id: string) => request(ENDPOINTS.attendance.session(id), { schema: AttendanceSessionDetail }),
  updateRecords: (id: string, body: UpdateAttendanceRecordsBody) =>
    request(ENDPOINTS.attendance.records(id), {
      method: HttpMethod.PUT,
      body,
      schema: AttendanceSessionDetail,
    }),
  confirm: (id: string) =>
    request(ENDPOINTS.attendance.confirm(id), {
      method: HttpMethod.POST,
      body: {},
      schema: AttendanceSessionDetail,
    }),
  create: (body: CreateAttendanceSessionBody) =>
    request(ENDPOINTS.attendance.sessions, {
      method: HttpMethod.POST,
      body,
      schema: AttendanceSessionDetail,
    }),
  cancel: (body: CancelAttendanceSessionsBody) =>
    request(ENDPOINTS.attendance.cancel, {
      method: HttpMethod.POST,
      body,
      schema: CancelAttendanceSessionsResponse,
    }),
  studentAttendance: (studentId: string, month: string) =>
    request(ENDPOINTS.students.attendance(studentId), {
      query: { month },
      schema: StudentAttendanceResponse,
    }),
  digest: (token: string) =>
    request(ENDPOINTS.attendance.digest(token), { auth: false, schema: AttendanceDigestView }),
  confirmDigest: (token: string, body: ConfirmDigestBody) =>
    request(ENDPOINTS.attendance.confirmDigest(token), {
      method: HttpMethod.POST,
      body,
      auth: false,
      schema: ConfirmDigestResponse,
    }),
};
