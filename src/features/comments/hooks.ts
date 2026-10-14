import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateCommentBody, UpdateCommentBody } from '@phonics/contracts';
import { commentsService } from '@/features/comments/api/commentsService';
import { qk } from '@/shared/api/queryKeys';

export const useComments = (submissionId: string | undefined) =>
  useQuery({
    queryKey: qk.comments.bySubmission(submissionId ?? ''),
    queryFn: () => commentsService.list(submissionId!),
    enabled: !!submissionId,
  });

function useInvalidateComments(submissionId: string) {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: qk.comments.bySubmission(submissionId) });
}

export function useCreateComment(submissionId: string) {
  const invalidate = useInvalidateComments(submissionId);
  return useMutation({
    mutationFn: (body: CreateCommentBody) => commentsService.create(submissionId, body),
    onSuccess: invalidate,
  });
}

export function useUpdateComment(submissionId: string) {
  const invalidate = useInvalidateComments(submissionId);
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCommentBody }) => commentsService.update(id, body),
    onSuccess: invalidate,
  });
}

export function useDeleteComment(submissionId: string) {
  const invalidate = useInvalidateComments(submissionId);
  return useMutation({ mutationFn: (id: string) => commentsService.remove(id), onSuccess: invalidate });
}
