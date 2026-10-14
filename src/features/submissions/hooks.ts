import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GradeSubmissionBody } from '@phonics/contracts';
import { submissionsService } from '@/features/submissions/api/submissionsService';
import type { SubmissionModel } from '@/features/submissions/models/SubmissionModel';
import { qk } from '@/shared/api/queryKeys';

export const useSubmission = (id: string | undefined) =>
  useQuery({
    queryKey: qk.submissions.detail(id ?? ''),
    queryFn: () => submissionsService.detail(id!),
    enabled: !!id,
  });

/** Chấm xong: bài nộp, roster / ranking / thống kê của bài giao và học sinh đều đổi */
function useInvalidateSubmission() {
  const qc = useQueryClient();
  return (s: SubmissionModel) => {
    qc.setQueryData(qk.submissions.detail(s.id), s);
    void qc.invalidateQueries({ queryKey: qk.assignments.detail(s.assignmentId) });
    void qc.invalidateQueries({ queryKey: qk.assignments.list({}).slice(0, 2) });
    void qc.invalidateQueries({ queryKey: qk.worksheetStats.all });
    void qc.invalidateQueries({ queryKey: qk.students.all });
  };
}

export function useGradeSubmission() {
  const invalidate = useInvalidateSubmission();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: GradeSubmissionBody }) =>
      submissionsService.grade(id, body),
    onSuccess: invalidate,
  });
}

export function useReopenSubmission() {
  const invalidate = useInvalidateSubmission();
  return useMutation({ mutationFn: (id: string) => submissionsService.reopen(id), onSuccess: invalidate });
}
