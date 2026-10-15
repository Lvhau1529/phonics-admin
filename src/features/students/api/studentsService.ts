/**
 * Service học sinh: gọi `studentsRepository` rồi đổi DTO → model (`StudentModel`, `StudentDetailModel`,
 * `PointEntryModel`, `GameResultModel`, `StudentGameModel`), kèm hook React Query. Component gọi thẳng service.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  MoveClassBody,
  ResetPasswordBody,
  SetStudentGameUnlockBody,
  StudentDetail,
  UpdateStudentBody,
} from '@phonics/contracts';
import { PointEntryModel } from '@/features/points/models/PointEntryModel';
import { studentsRepository } from '@/features/students/api/studentsRepository';
import { GameResultModel } from '@/features/students/models/GameResultModel';
import { StudentDetailModel } from '@/features/students/models/StudentDetailModel';
import { StudentGameModel } from '@/features/students/models/StudentGameModel';
import { StudentModel } from '@/features/students/models/StudentModel';
import type { QueryParams } from '@/shared/api/client';
import { mapPage } from '@/shared/api/pagination';
import { qk } from '@/shared/api/queryKeys';

const toDetail = (data: StudentDetail) => new StudentDetailModel(data);

const api = {
  list: async (query: QueryParams) =>
    mapPage(await studentsRepository.list(query), (s) => new StudentModel(s)),
  detail: async (id: string) => toDetail(await studentsRepository.detail(id)),
  update: async (id: string, body: UpdateStudentBody) => toDetail(await studentsRepository.update(id, body)),
  moveClass: async (id: string, body: MoveClassBody) =>
    toDetail(await studentsRepository.moveClass(id, body)),
  resetPassword: (id: string, body: ResetPasswordBody) => studentsRepository.resetPassword(id, body),
  points: async (id: string, query: QueryParams) =>
    mapPage(await studentsRepository.points(id, query), (e) => new PointEntryModel(e)),
  /** Điểm theo game là số liệu thống kê (biểu đồ) → giữ DTO */
  pointsByGame: async (id: string, query: QueryParams) =>
    (await studentsRepository.pointsByGame(id, query)).items,
  gameResults: async (id: string, query: QueryParams) =>
    mapPage(await studentsRepository.gameResults(id, query), (r) => new GameResultModel(r)),
  games: async (id: string) => (await studentsRepository.games(id)).items.map((g) => new StudentGameModel(g)),
  setGameUnlock: async (id: string, gameId: string, body: SetStudentGameUnlockBody) =>
    new StudentGameModel(await studentsRepository.setGameUnlock(id, gameId, body)),
};

/** Sau khi sửa học sinh: cập nhật chi tiết, làm mới danh sách và lớp (sĩ số / hạng) */
function useInvalidateStudent() {
  const qc = useQueryClient();
  return (student?: StudentDetailModel) => {
    void qc.invalidateQueries({ queryKey: qk.students.all });
    void qc.invalidateQueries({ queryKey: qk.classes.all });
    if (student) qc.setQueryData(qk.students.detail(student.id), student);
  };
}

export const StudentsService = {
  ...api,

  useList: (params: QueryParams) =>
    useQuery({ queryKey: qk.students.list(params), queryFn: () => api.list(params) }),

  /** Học sinh của một lớp (≤100) cho ô chọn */
  useOptions(classId: string | undefined) {
    const params: QueryParams = { classId, pageSize: 100, sort: 'displayName:asc' };
    return useQuery({
      queryKey: qk.students.list(params),
      queryFn: () => api.list(params),
      select: (data) => data.items,
      enabled: !!classId,
      staleTime: 60_000,
    });
  },

  useDetail: (id: string | undefined) =>
    useQuery({
      queryKey: qk.students.detail(id ?? ''),
      queryFn: () => api.detail(id!),
      enabled: !!id,
    }),

  usePoints: (id: string, params: QueryParams) =>
    useQuery({ queryKey: qk.students.points(id, params), queryFn: () => api.points(id, params) }),

  usePointsByGame: (id: string, params: QueryParams) =>
    useQuery({
      queryKey: qk.students.pointsByGame(id, params),
      queryFn: () => api.pointsByGame(id, params),
    }),

  useGameResults: (id: string, params: QueryParams) =>
    useQuery({
      queryKey: qk.students.gameResults(id, params),
      queryFn: () => api.gameResults(id, params),
    }),

  useGames: (id: string) =>
    useQuery({
      queryKey: qk.students.games(id),
      queryFn: () => api.games(id),
    }),

  useUpdate() {
    const invalidate = useInvalidateStudent();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: UpdateStudentBody }) => api.update(id, body),
      onSuccess: (student) => invalidate(student),
    });
  },

  useMoveClass() {
    const invalidate = useInvalidateStudent();
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: MoveClassBody }) => api.moveClass(id, body),
      onSuccess: (student) => {
        invalidate(student);
        void qc.invalidateQueries({ queryKey: qk.stats.all });
      },
    });
  },

  useResetPassword: () =>
    useMutation({
      mutationFn: ({ id, body }: { id: string; body: ResetPasswordBody }) => api.resetPassword(id, body),
    }),

  useSetGameUnlock(studentId: string) {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ gameId, body }: { gameId: string; body: SetStudentGameUnlockBody }) =>
        api.setGameUnlock(studentId, gameId, body),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: qk.students.games(studentId) });
        void qc.invalidateQueries({ queryKey: qk.games.all });
      },
    });
  },
};
