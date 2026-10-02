import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AwardBonusBatchBody,
  AwardBonusBody,
  CreateClassBody,
  SetClassTeachersBody,
  UnlockClassBody,
  UpdateClassBody,
} from '@phonics/contracts';
import { classesService } from '@/features/classes/api/classesService';
import type { ClassModel } from '@/features/classes/models/ClassModel';
import type { QueryParams } from '@/shared/api/client';
import { qk } from '@/shared/api/queryKeys';

export const useClassesList = (params: QueryParams) =>
  useQuery({ queryKey: qk.classes.list(params), queryFn: () => classesService.list(params) });

/** Mọi lớp đang hoạt động (≤100) cho ô chọn lớp — giáo viên chỉ nhận lớp mình (server lọc) */
export function useClassOptions(includeArchived = false) {
  const params: QueryParams = {
    pageSize: 100,
    sort: 'name:asc',
    archived: includeArchived ? true : undefined,
  };
  return useQuery({
    queryKey: qk.classes.list(params),
    queryFn: () => classesService.list(params),
    select: (data) => data.items,
    staleTime: 5 * 60_000,
  });
}

export const useClass = (id: string | undefined) =>
  useQuery({
    queryKey: qk.classes.detail(id ?? ''),
    queryFn: () => classesService.detail(id!),
    enabled: !!id,
  });

export const useClassStudents = (id: string, params: QueryParams) =>
  useQuery({ queryKey: qk.classes.students(id, params), queryFn: () => classesService.students(id, params) });

export const useClassRanking = (id: string | undefined, params: QueryParams) =>
  useQuery({
    queryKey: qk.classes.ranking(id ?? '', params),
    queryFn: () => classesService.ranking(id!, params),
    enabled: !!id,
  });

export const useClassPoints = (id: string | undefined, params: QueryParams) =>
  useQuery({
    queryKey: qk.classes.points(id ?? '', params),
    queryFn: () => classesService.points(id!, params),
    enabled: !!id,
  });

/** Sau khi sửa lớp: làm mới danh sách + chi tiết; giáo viên / học sinh có thể đổi theo */
function useInvalidateClasses() {
  const qc = useQueryClient();
  return (cls?: ClassModel) => {
    void qc.invalidateQueries({ queryKey: qk.classes.all });
    void qc.invalidateQueries({ queryKey: qk.teachers.all });
    if (cls) qc.setQueryData(qk.classes.detail(cls.id), cls);
  };
}

export function useCreateClass() {
  const invalidate = useInvalidateClasses();
  return useMutation({
    mutationFn: (body: CreateClassBody) => classesService.create(body),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateClass() {
  const invalidate = useInvalidateClasses();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateClassBody }) => classesService.update(id, body),
    onSuccess: (cls) => invalidate(cls),
  });
}

export function useSetClassTeachers() {
  const invalidate = useInvalidateClasses();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SetClassTeachersBody }) =>
      classesService.setTeachers(id, body),
    onSuccess: (cls) => invalidate(cls),
  });
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

export function useAwardBonus(classId: string) {
  const invalidate = useInvalidatePoints(classId);
  return useMutation({
    mutationFn: (body: AwardBonusBody) => classesService.bonus(classId, body),
    onSuccess: invalidate,
  });
}

export function useAwardBonusBatch(classId: string) {
  const invalidate = useInvalidatePoints(classId);
  return useMutation({
    mutationFn: (body: AwardBonusBatchBody) => classesService.bonusBatch(classId, body),
    onSuccess: invalidate,
  });
}

export function useUnlockClassGame(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gameId, body }: { gameId: string; body: UnlockClassBody }) =>
      classesService.unlockGame(classId, gameId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.students.all });
      void qc.invalidateQueries({ queryKey: qk.games.all });
    },
  });
}
