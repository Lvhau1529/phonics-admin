/**
 * Service điểm danh: DTO → `AttendanceSessionModel` / `AttendanceSessionDetailModel` / `DigestSessionModel` /
 * `StudentAttendanceItemModel` + hook React Query. Số buổi chờ (badge menu) và kết quả huỷ / duyệt qua mail là
 * response xác nhận → giữ DTO (kèm model khi cần hiển thị).
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CancelAttendanceSessionsBody,
  CreateAttendanceSessionBody,
  UpdateAttendanceRecordsBody,
} from '@phonics/contracts';
import { attendanceRepository } from '@/features/attendance/api/attendanceRepository';
import {
  AttendanceSessionDetailModel,
  AttendanceSessionModel,
  DigestSessionModel,
  StudentAttendanceItemModel,
} from '@/features/attendance/models/AttendanceSessionModel';
import type { QueryParams } from '@/shared/api/client';
import { mapPage } from '@/shared/api/pagination';
import { qk } from '@/shared/api/queryKeys';

/** Badge menu làm mới mỗi phút */
const PENDING_COUNT_REFETCH_MS = 60_000;

const digestOf = (view: Awaited<ReturnType<typeof attendanceRepository.digest>>) => ({
  teacherName: view.teacherName,
  date: view.date,
  expiresAt: view.expiresAt,
  sessions: view.sessions.map((s) => new DigestSessionModel(s)),
});

export type DigestModel = ReturnType<typeof digestOf>;

const api = {
  list: async (query: QueryParams) =>
    mapPage(await attendanceRepository.list(query), (s) => new AttendanceSessionModel(s)),
  pendingCount: async () => (await attendanceRepository.pendingCount()).count,
  detail: async (id: string) => new AttendanceSessionDetailModel(await attendanceRepository.detail(id)),
  updateRecords: async (id: string, body: UpdateAttendanceRecordsBody) =>
    new AttendanceSessionDetailModel(await attendanceRepository.updateRecords(id, body)),
  confirm: async (id: string) => new AttendanceSessionDetailModel(await attendanceRepository.confirm(id)),
  create: async (body: CreateAttendanceSessionBody) =>
    new AttendanceSessionDetailModel(await attendanceRepository.create(body)),
  cancel: (body: CancelAttendanceSessionsBody) => attendanceRepository.cancel(body),
  studentAttendance: async (studentId: string, month: string) => {
    const res = await attendanceRepository.studentAttendance(studentId, month);
    return {
      month: res.month,
      items: res.items.map((i) => new StudentAttendanceItemModel(i)),
      chargedTotal: res.chargedTotal,
    };
  },
  digest: async (token: string) => digestOf(await attendanceRepository.digest(token)),
  confirmDigest: async (token: string, sessionIds: string[]) => {
    const res = await attendanceRepository.confirmDigest(token, { sessionIds });
    return {
      confirmed: res.confirmed,
      alreadyConfirmed: res.alreadyConfirmed,
      rejected: res.rejected,
      digest: digestOf(res.digest),
    };
  },
};

/** Đổi điểm danh: làm mới danh sách / chi tiết / badge / bảng tháng của học sinh */
function useInvalidateAttendance() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: qk.attendance.all });
}

export const AttendanceService = {
  ...api,

  useList: (params: QueryParams) =>
    useQuery({ queryKey: qk.attendance.list(params), queryFn: () => api.list(params) }),

  usePendingCount: (enabled: boolean) =>
    useQuery({
      queryKey: qk.attendance.pendingCount,
      queryFn: api.pendingCount,
      enabled,
      refetchInterval: PENDING_COUNT_REFETCH_MS,
    }),

  useDetail: (id: string) => useQuery({ queryKey: qk.attendance.detail(id), queryFn: () => api.detail(id) }),

  useStudentAttendance: (studentId: string, month: string) =>
    useQuery({
      queryKey: qk.attendance.student(studentId, month),
      queryFn: () => api.studentAttendance(studentId, month),
      placeholderData: keepPreviousData,
    }),

  /** Trang public: không retry khi token hỏng / hết hạn */
  useDigest: (token: string) =>
    useQuery({ queryKey: qk.attendance.digest(token), queryFn: () => api.digest(token), retry: false }),

  useUpdateRecords() {
    const invalidate = useInvalidateAttendance();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: UpdateAttendanceRecordsBody }) =>
        api.updateRecords(id, body),
      onSuccess: invalidate,
    });
  },

  useConfirm() {
    const invalidate = useInvalidateAttendance();
    return useMutation({ mutationFn: api.confirm, onSuccess: invalidate });
  },

  useCreate() {
    const invalidate = useInvalidateAttendance();
    return useMutation({ mutationFn: api.create, onSuccess: invalidate });
  },

  useCancel() {
    const invalidate = useInvalidateAttendance();
    return useMutation({ mutationFn: api.cancel, onSuccess: invalidate });
  },

  useConfirmDigest(token: string) {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (sessionIds: string[]) => api.confirmDigest(token, sessionIds),
      onSuccess: (res) => qc.setQueryData(qk.attendance.digest(token), res.digest),
    });
  },
};
