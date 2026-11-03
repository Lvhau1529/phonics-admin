/**
 * Service học phí tạm tính (từ điểm danh): DTO → `TuitionOverviewModel` / `StudentTuitionModel` + hook. Khoá cache nằm
 * dưới `qk.attendance` nên sửa / xác nhận điểm danh tự làm mới số liệu. Phiếu PDF là file tải về (không cần model).
 */
import type { UpdateTuitionSettings } from '@phonics/contracts';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tuitionRepository } from '@/features/tuition/api/tuitionRepository';
import { TuitionSettingsModel } from '@/features/tuition/models/TuitionSettingsModel';
import { StudentTuitionModel, TuitionOverviewModel } from '@/features/tuition/models/TuitionModel';
import { qk } from '@/shared/api/queryKeys';

const api = {
  overview: async (from: string, to: string) =>
    new TuitionOverviewModel(await tuitionRepository.overview({ from, to })),
  student: async (studentId: string, from: string, to: string) =>
    new StudentTuitionModel(await tuitionRepository.student(studentId, { from, to })),
  /** Phiếu báo học phí một tháng (gộp các bé cùng phụ huynh nhận học phí) → `{ blob, filename }` */
  statement: (studentId: string, month: string) => tuitionRepository.statement(studentId, month),
  settings: async () => new TuitionSettingsModel(await tuitionRepository.settings()),
  updateSettings: async (body: UpdateTuitionSettings) =>
    new TuitionSettingsModel(await tuitionRepository.updateSettings(body)),
};

export const TuitionService = {
  ...api,

  useOverview: (from: string, to: string) =>
    useQuery({
      queryKey: qk.attendance.tuition(from, to),
      queryFn: () => api.overview(from, to),
      placeholderData: keepPreviousData,
    }),

  useStudent: (studentId: string, from: string, to: string) =>
    useQuery({
      queryKey: qk.attendance.studentTuition(studentId, from, to),
      queryFn: () => api.student(studentId, from, to),
      placeholderData: keepPreviousData,
    }),

  useSettings: () => useQuery({ queryKey: qk.attendance.tuitionSettings, queryFn: api.settings }),

  useUpdateSettings() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: api.updateSettings,
      onSuccess: (saved) => queryClient.setQueryData(qk.attendance.tuitionSettings, saved),
    });
  },
};
