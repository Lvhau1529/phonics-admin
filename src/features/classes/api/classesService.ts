/**
 * Service lớp học: gọi `classesRepository` rồi đổi DTO → model (`ClassModel`, `StudentModel`, `PointEntryModel`),
 * kèm hook React Query (`ClassesService.useList(...)`). Component gọi thẳng service, không gọi repository.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AwardBonusBatchBody,
  ClassSummary,
  AwardBonusBody,
  CreateClassBody,
  SetClassTeachersBody,
  UnlockClassBody,
  UpdateClassBody,
} from '@phonics/contracts';
import { classesRepository } from '@/features/classes/api/classesRepository';
import { ClassModel } from '@/features/classes/models/ClassModel';
import { PointEntryModel } from '@/features/points/models/PointEntryModel';
import { StudentModel } from '@/features/students/models/StudentModel';
import type { QueryParams } from '@/shared/api/client';
import { mapPage } from '@/shared/api/pagination';
import { qk } from '@/shared/api/queryKeys';

const toClass = (data: ClassSummary) => new ClassModel(data);

const api = {
  list: async (query: QueryParams) => mapPage(await classesRepository.list(query), toClass),
  detail: async (id: string) => toClass(await classesRepository.detail(id)),
  create: async (body: CreateClassBody) => toClass(await classesRepository.create(body)),
  update: async (id: string, body: UpdateClassBody) => toClass(await classesRepository.update(id, body)),
  setTeachers: async (id: string, body: SetClassTeachersBody) =>
    toClass(await classesRepository.setTeachers(id, body)),
  students: async (id: string, query: QueryParams) =>
    mapPage(await classesRepository.students(id, query), (s) => new StudentModel(s)),
  /** Bảng xếp hạng là số liệu thống kê → giữ DTO */
  ranking: (id: string, query: QueryParams) => classesRepository.ranking(id, query),
  points: async (id: string, query: QueryParams) =>
    mapPage(await classesRepository.points(id, query), (e) => new PointEntryModel(e)),
  bonus: (id: string, body: AwardBonusBody) => classesRepository.bonus(id, body),
  bonusBatch: (id: string, body: AwardBonusBatchBody) => classesRepository.bonusBatch(id, body),
  unlockGame: (id: string, gameId: string, body: UnlockClassBody) =>
    classesRepository.unlockGame(id, gameId, body),
};

/** Sau khi sửa lớp: làm mới danh sách + chi tiết; giáo viên / học sinh có thể đổi theo */
function useInvalidateClasses() {
  const qc = useQueryClient();
  return (cls?: ClassModel) => {
    void qc.invalidateQueries({ queryKey: qk.classes.all });
    void qc.invalidateQueries({ queryKey: qk.teachers.all });
    if (cls) qc.setQueryData(qk.classes.detail(cls.id), cls);
  };
}

/** Cộng điểm xong: điểm / hạng / sổ điểm của lớp, học sinh và thống kê đều đổi */
function useInvalidatePoints(classId: string) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: qk.classes.detail(classId) });
    void qc.invalidateQueries({ queryKey: qk.students.all });
    void qc.invalidateQueries({ queryKey: qk.stats.all });
  };
}

export const ClassesService = {
  ...api,

  useList: (params: QueryParams) =>
    useQuery({ queryKey: qk.classes.list(params), queryFn: () => api.list(params) }),

  /** Mọi lớp đang hoạt động (≤100) cho ô chọn lớp — giáo viên chỉ nhận lớp mình (server lọc) */
  useOptions(includeArchived = false) {
    const params: QueryParams = {
      pageSize: 100,
      sort: 'name:asc',
      archived: includeArchived ? true : undefined,
    };
    return useQuery({
      queryKey: qk.classes.list(params),
      queryFn: () => api.list(params),
      select: (data) => data.items,
      staleTime: 5 * 60_000,
    });
  },

  useDetail: (id: string | undefined) =>
    useQuery({
      queryKey: qk.classes.detail(id ?? ''),
      queryFn: () => api.detail(id!),
      enabled: !!id,
    }),

  useStudents: (id: string, params: QueryParams) =>
    useQuery({ queryKey: qk.classes.students(id, params), queryFn: () => api.students(id, params) }),

  useRanking: (id: string | undefined, params: QueryParams) =>
    useQuery({
      queryKey: qk.classes.ranking(id ?? '', params),
      queryFn: () => api.ranking(id!, params),
      enabled: !!id,
    }),

  usePoints: (id: string | undefined, params: QueryParams) =>
    useQuery({
      queryKey: qk.classes.points(id ?? '', params),
      queryFn: () => api.points(id!, params),
      enabled: !!id,
    }),

  useCreate() {
    const invalidate = useInvalidateClasses();
    return useMutation({
      mutationFn: (body: CreateClassBody) => api.create(body),
      onSuccess: () => invalidate(),
    });
  },

  useUpdate() {
    const invalidate = useInvalidateClasses();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: UpdateClassBody }) => api.update(id, body),
      onSuccess: (cls) => invalidate(cls),
    });
  },

  useSetTeachers() {
    const invalidate = useInvalidateClasses();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: SetClassTeachersBody }) => api.setTeachers(id, body),
      onSuccess: (cls) => invalidate(cls),
    });
  },

  useBonus(classId: string) {
    const invalidate = useInvalidatePoints(classId);
    return useMutation({
      mutationFn: (body: AwardBonusBody) => api.bonus(classId, body),
      onSuccess: invalidate,
    });
  },

  useBonusBatch(classId: string) {
    const invalidate = useInvalidatePoints(classId);
    return useMutation({
      mutationFn: (body: AwardBonusBatchBody) => api.bonusBatch(classId, body),
      onSuccess: invalidate,
    });
  },

  useUnlockGame(classId: string) {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ gameId, body }: { gameId: string; body: UnlockClassBody }) =>
        api.unlockGame(classId, gameId, body),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: qk.students.all });
        void qc.invalidateQueries({ queryKey: qk.games.all });
      },
    });
  },
};
