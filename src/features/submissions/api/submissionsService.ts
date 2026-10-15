/** Service bài nộp: repository → SubmissionModel, kèm hook React Query */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GradeSubmissionBody } from '@phonics/contracts';
import { submissionsRepository } from '@/features/submissions/api/submissionsRepository';
import { SubmissionModel } from '@/features/submissions/models/SubmissionModel';
import { qk } from '@/shared/api/queryKeys';

const api = {
  detail: async (id: string) => new SubmissionModel(await submissionsRepository.detail(id)),
  grade: async (id: string, body: GradeSubmissionBody) =>
    new SubmissionModel(await submissionsRepository.grade(id, body)),
  reopen: async (id: string) => new SubmissionModel(await submissionsRepository.reopen(id)),
};

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

export const SubmissionsService = {
  ...api,

  useDetail: (id: string | undefined) =>
    useQuery({
      queryKey: qk.submissions.detail(id ?? ''),
      queryFn: () => api.detail(id!),
      enabled: !!id,
    }),

  useGrade() {
    const invalidate = useInvalidateSubmission();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: GradeSubmissionBody }) => api.grade(id, body),
      onSuccess: invalidate,
    });
  },

  useReopen() {
    const invalidate = useInvalidateSubmission();
    return useMutation({ mutationFn: (id: string) => api.reopen(id), onSuccess: invalidate });
  },
};
