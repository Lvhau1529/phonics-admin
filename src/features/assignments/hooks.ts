import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateAssignmentBody, UpdateAssignmentBody } from '@phonics/contracts';
import { assignmentsService } from '@/features/assignments/api/assignmentsService';
import type { AssignmentDetailModel } from '@/features/assignments/models/AssignmentModel';
import type { QueryParams } from '@/shared/api/client';
import { qk } from '@/shared/api/queryKeys';

export const useAssignmentsList = (params: QueryParams) =>
  useQuery({ queryKey: qk.assignments.list(params), queryFn: () => assignmentsService.list(params) });

/** Bài giao trong khoảng ngày (lịch): tối đa 100, sort theo ngày */
export const useAssignmentsCalendar = (from: string, to: string, classId?: string) =>
  useQuery({
    queryKey: qk.assignments.calendar(from, to, classId),
    queryFn: () => assignmentsService.list({ from, to, classId, pageSize: 100, sort: 'scheduledFor:asc' }),
    select: (page) => page.items,
  });

export const useAssignmentsDashboard = () =>
  useQuery({ queryKey: qk.assignments.dashboard, queryFn: assignmentsService.dashboard });

export const useAssignment = (id: string | undefined) =>
  useQuery({
    queryKey: qk.assignments.detail(id ?? ''),
    queryFn: () => assignmentsService.detail(id!),
    enabled: !!id,
  });

export const useAssignmentRoster = (id: string | undefined) =>
  useQuery({
    queryKey: qk.assignments.roster(id ?? ''),
    queryFn: () => assignmentsService.roster(id!),
    enabled: !!id,
  });

export const useAssignmentRanking = (id: string | undefined) =>
  useQuery({
    queryKey: qk.assignments.ranking(id ?? ''),
    queryFn: () => assignmentsService.ranking(id!),
    enabled: !!id,
  });

function useInvalidateAssignments() {
  const qc = useQueryClient();
  return (a?: AssignmentDetailModel) => {
    void qc.invalidateQueries({ queryKey: qk.assignments.all });
    void qc.invalidateQueries({ queryKey: qk.worksheets.all });
    void qc.invalidateQueries({ queryKey: qk.worksheetStats.all });
    if (a) qc.setQueryData(qk.assignments.detail(a.id), a);
  };
}

export function useCreateAssignment() {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: (body: CreateAssignmentBody) => assignmentsService.create(body),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateAssignment() {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAssignmentBody }) =>
      assignmentsService.update(id, body),
    onSuccess: (a) => invalidate(a),
  });
}

export function useCloseAssignment() {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: (id: string) => assignmentsService.close(id),
    onSuccess: (a) => invalidate(a),
  });
}

export function useReopenAssignment() {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: (id: string) => assignmentsService.reopen(id),
    onSuccess: (a) => invalidate(a),
  });
}

export function useDeleteAssignment() {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: (id: string) => assignmentsService.remove(id),
    onSuccess: () => invalidate(),
  });
}
