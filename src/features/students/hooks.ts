import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  MoveClassBody,
  ResetPasswordBody,
  SetStudentGameUnlockBody,
  StudentDetail,
  UpdateStudentBody,
} from '@phonics/contracts';
import { studentsApi } from '@/features/students/api';
import type { QueryParams } from '@/shared/api/client';
import { qk } from '@/shared/api/queryKeys';

export const useStudentsList = (params: QueryParams) =>
  useQuery({ queryKey: qk.students.list(params), queryFn: () => studentsApi.list(params) });

/** Học sinh của một lớp (≤100) cho ô chọn */
export function useStudentOptions(classId: string | undefined) {
  const params: QueryParams = { classId, pageSize: 100, sort: 'displayName:asc' };
  return useQuery({
    queryKey: qk.students.list(params),
    queryFn: () => studentsApi.list(params),
    select: (data) => data.items,
    enabled: !!classId,
    staleTime: 60_000,
  });
}

export const useStudent = (id: string | undefined) =>
  useQuery({ queryKey: qk.students.detail(id ?? ''), queryFn: () => studentsApi.detail(id!), enabled: !!id });

export const useStudentPoints = (id: string, params: QueryParams) =>
  useQuery({ queryKey: qk.students.points(id, params), queryFn: () => studentsApi.points(id, params) });

export const useStudentPointsByGame = (id: string, params: QueryParams) =>
  useQuery({
    queryKey: qk.students.pointsByGame(id, params),
    queryFn: () => studentsApi.pointsByGame(id, params),
    select: (data) => data.items,
  });

export const useStudentGameResults = (id: string, params: QueryParams) =>
  useQuery({
    queryKey: qk.students.gameResults(id, params),
    queryFn: () => studentsApi.gameResults(id, params),
  });

export const useStudentGames = (id: string) =>
  useQuery({
    queryKey: qk.students.games(id),
    queryFn: () => studentsApi.games(id),
    select: (data) => data.items,
  });

/** Sau khi sửa học sinh: cập nhật chi tiết, làm mới danh sách và lớp (sĩ số / hạng) */
function useInvalidateStudent() {
  const qc = useQueryClient();
  return (student?: StudentDetail) => {
    void qc.invalidateQueries({ queryKey: qk.students.all });
    void qc.invalidateQueries({ queryKey: qk.classes.all });
    if (student) qc.setQueryData(qk.students.detail(student.id), student);
  };
}

export function useUpdateStudent() {
  const invalidate = useInvalidateStudent();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateStudentBody }) => studentsApi.update(id, body),
    onSuccess: (student) => invalidate(student),
  });
}

export function useMoveClass() {
  const invalidate = useInvalidateStudent();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: MoveClassBody }) => studentsApi.moveClass(id, body),
    onSuccess: (student) => {
      invalidate(student);
      void qc.invalidateQueries({ queryKey: qk.stats.all });
    },
  });
}

export const useResetPassword = () =>
  useMutation({
    mutationFn: ({ id, body }: { id: string; body: ResetPasswordBody }) =>
      studentsApi.resetPassword(id, body),
  });

export function useSetStudentGameUnlock(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gameId, body }: { gameId: string; body: SetStudentGameUnlockBody }) =>
      studentsApi.setGameUnlock(studentId, gameId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.students.games(studentId) });
      void qc.invalidateQueries({ queryKey: qk.games.all });
    },
  });
}
