import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateTeacherBody, SetTeacherClassesBody, UpdateTeacherBody } from '@phonics/contracts';
import { teachersApi } from '@/features/teachers/api';
import type { QueryParams } from '@/shared/api/client';
import { qk } from '@/shared/api/queryKeys';

export const useTeachersList = (params: QueryParams) =>
  useQuery({ queryKey: qk.teachers.list(params), queryFn: () => teachersApi.list(params) });

/** Giáo viên đang hoạt động (≤100) cho ô chọn / tìm kiếm */
export function useTeacherOptions(q?: string) {
  const params: QueryParams = { pageSize: 100, sort: 'displayName:asc', status: 'ACTIVE', q: q || undefined };
  return useQuery({
    queryKey: qk.teachers.list(params),
    queryFn: () => teachersApi.list(params),
    select: (data) => data.items,
    staleTime: 60_000,
  });
}

function useInvalidateTeachers() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: qk.teachers.all });
    void qc.invalidateQueries({ queryKey: qk.classes.all });
  };
}

export function useCreateTeacher() {
  const invalidate = useInvalidateTeachers();
  return useMutation({
    mutationFn: (body: CreateTeacherBody) => teachersApi.create(body),
    onSuccess: invalidate,
  });
}

export function useUpdateTeacher() {
  const invalidate = useInvalidateTeachers();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTeacherBody }) => teachersApi.update(id, body),
    onSuccess: invalidate,
  });
}

export function useSetTeacherClasses() {
  const invalidate = useInvalidateTeachers();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SetTeacherClassesBody }) =>
      teachersApi.setClasses(id, body),
    onSuccess: invalidate,
  });
}
