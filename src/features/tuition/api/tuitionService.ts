/**
 * Service học phí tạm tính (từ điểm danh): DTO → `TuitionOverviewModel` / `StudentTuitionModel` + hook. Khoá cache nằm
 * dưới `qk.attendance` nên sửa / xác nhận điểm danh tự làm mới số liệu.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { tuitionRepository } from '@/features/tuition/api/tuitionRepository';
import { StudentTuitionModel, TuitionOverviewModel } from '@/features/tuition/models/TuitionModel';
import { qk } from '@/shared/api/queryKeys';

const api = {
  overview: async (from: string, to: string) =>
    new TuitionOverviewModel(await tuitionRepository.overview({ from, to })),
  student: async (studentId: string, from: string, to: string) =>
    new StudentTuitionModel(await tuitionRepository.student(studentId, { from, to })),
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
};
