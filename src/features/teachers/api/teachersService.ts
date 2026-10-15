/**
 * Service giáo viên: gọi `teachersRepository` rồi đổi DTO → `TeacherModel`, kèm hook React Query.
 * Component gọi thẳng service.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateTeacherBody,
  SetTeacherClassesBody,
  TeacherSummary,
  UpdateTeacherBody,
} from '@phonics/contracts';
import { teachersRepository } from '@/features/teachers/api/teachersRepository';
import { TeacherModel } from '@/features/teachers/models/TeacherModel';
import type { QueryParams } from '@/shared/api/client';
import { mapPage } from '@/shared/api/pagination';
import { qk } from '@/shared/api/queryKeys';

const toTeacher = (data: TeacherSummary) => new TeacherModel(data);

const api = {
  list: async (query: QueryParams) => mapPage(await teachersRepository.list(query), toTeacher),
  create: async (body: CreateTeacherBody) => toTeacher(await teachersRepository.create(body)),
  update: async (id: string, body: UpdateTeacherBody) => toTeacher(await teachersRepository.update(id, body)),
  setClasses: async (id: string, body: SetTeacherClassesBody) =>
    toTeacher(await teachersRepository.setClasses(id, body)),
};

function useInvalidateTeachers() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: qk.teachers.all });
    void qc.invalidateQueries({ queryKey: qk.classes.all });
  };
}

export const TeachersService = {
  ...api,

  useList: (params: QueryParams) =>
    useQuery({ queryKey: qk.teachers.list(params), queryFn: () => api.list(params) }),

  /** Giáo viên đang hoạt động (≤100) cho ô chọn / tìm kiếm */
  useOptions(q?: string) {
    const params: QueryParams = {
      pageSize: 100,
      sort: 'displayName:asc',
      status: 'ACTIVE',
      q: q || undefined,
    };
    return useQuery({
      queryKey: qk.teachers.list(params),
      queryFn: () => api.list(params),
      select: (data) => data.items,
      staleTime: 60_000,
    });
  },

  useCreate() {
    const invalidate = useInvalidateTeachers();
    return useMutation({
      mutationFn: (body: CreateTeacherBody) => api.create(body),
      onSuccess: invalidate,
    });
  },

  useUpdate() {
    const invalidate = useInvalidateTeachers();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: UpdateTeacherBody }) => api.update(id, body),
      onSuccess: invalidate,
    });
  },

  useSetClasses() {
    const invalidate = useInvalidateTeachers();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: SetTeacherClassesBody }) => api.setClasses(id, body),
      onSuccess: invalidate,
    });
  },
};
