/**
 * Service bài giao: repository → model; roster / ranking / dashboard là số liệu → giữ DTO.
 * Kèm hook React Query (`AssignmentsService.useList(...)`); component gọi thẳng service.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateAssignmentBody, UpdateAssignmentBody } from '@phonics/contracts';
import { assignmentsRepository } from '@/features/assignments/api/assignmentsRepository';
import { AssignmentDetailModel, AssignmentModel } from '@/features/assignments/models/AssignmentModel';
import type { QueryParams } from '@/shared/api/client';
import { mapPage } from '@/shared/api/pagination';
import { qk } from '@/shared/api/queryKeys';

const toDetail = (dto: ConstructorParameters<typeof AssignmentDetailModel>[0]) =>
  new AssignmentDetailModel(dto);

const api = {
  list: async (query: QueryParams) =>
    mapPage(await assignmentsRepository.list(query), (a) => new AssignmentModel(a)),
  dashboard: async () => {
    const d = await assignmentsRepository.dashboard();
    return { ...d, dueToday: d.dueToday.map((a) => new AssignmentModel(a)) };
  },
  detail: async (id: string) => toDetail(await assignmentsRepository.detail(id)),
  create: async (body: CreateAssignmentBody) => toDetail(await assignmentsRepository.create(body)),
  update: async (id: string, body: UpdateAssignmentBody) =>
    toDetail(await assignmentsRepository.update(id, body)),
  remove: (id: string) => assignmentsRepository.remove(id),
  close: async (id: string) => toDetail(await assignmentsRepository.close(id)),
  reopen: async (id: string) => toDetail(await assignmentsRepository.reopen(id)),
  roster: (id: string) => assignmentsRepository.roster(id),
  ranking: (id: string) => assignmentsRepository.ranking(id),
};

function useInvalidateAssignments() {
  const qc = useQueryClient();
  return (a?: AssignmentDetailModel) => {
    void qc.invalidateQueries({ queryKey: qk.assignments.all });
    void qc.invalidateQueries({ queryKey: qk.worksheets.all });
    void qc.invalidateQueries({ queryKey: qk.worksheetStats.all });
    if (a) qc.setQueryData(qk.assignments.detail(a.id), a);
  };
}

export const AssignmentsService = {
  ...api,

  useList: (params: QueryParams) =>
    useQuery({ queryKey: qk.assignments.list(params), queryFn: () => api.list(params) }),

  /** Bài giao trong khoảng ngày (lịch): tối đa 100, sort theo ngày */
  useCalendar: (from: string, to: string, classId?: string) =>
    useQuery({
      queryKey: qk.assignments.calendar(from, to, classId),
      queryFn: () => api.list({ from, to, classId, pageSize: 100, sort: 'scheduledFor:asc' }),
      select: (page) => page.items,
    }),

  useDashboard: () => useQuery({ queryKey: qk.assignments.dashboard, queryFn: api.dashboard }),

  useDetail: (id: string | undefined) =>
    useQuery({
      queryKey: qk.assignments.detail(id ?? ''),
      queryFn: () => api.detail(id!),
      enabled: !!id,
    }),

  useRoster: (id: string | undefined) =>
    useQuery({
      queryKey: qk.assignments.roster(id ?? ''),
      queryFn: () => api.roster(id!),
      enabled: !!id,
    }),

  useRanking: (id: string | undefined) =>
    useQuery({
      queryKey: qk.assignments.ranking(id ?? ''),
      queryFn: () => api.ranking(id!),
      enabled: !!id,
    }),

  useCreate() {
    const invalidate = useInvalidateAssignments();
    return useMutation({
      mutationFn: (body: CreateAssignmentBody) => api.create(body),
      onSuccess: () => invalidate(),
    });
  },

  useUpdate() {
    const invalidate = useInvalidateAssignments();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: UpdateAssignmentBody }) => api.update(id, body),
      onSuccess: (a) => invalidate(a),
    });
  },

  useClose() {
    const invalidate = useInvalidateAssignments();
    return useMutation({
      mutationFn: (id: string) => api.close(id),
      onSuccess: (a) => invalidate(a),
    });
  },

  useReopen() {
    const invalidate = useInvalidateAssignments();
    return useMutation({
      mutationFn: (id: string) => api.reopen(id),
      onSuccess: (a) => invalidate(a),
    });
  },

  useRemove() {
    const invalidate = useInvalidateAssignments();
    return useMutation({
      mutationFn: (id: string) => api.remove(id),
      onSuccess: () => invalidate(),
    });
  },
};
