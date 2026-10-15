/** Service nhận xét: repository → CommentModel, kèm hook React Query (theo bài nộp) */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateCommentBody, UpdateCommentBody } from '@phonics/contracts';
import { commentsRepository } from '@/features/comments/api/commentsRepository';
import { CommentModel } from '@/features/comments/models/CommentModel';
import { qk } from '@/shared/api/queryKeys';

const api = {
  list: async (submissionId: string) =>
    (await commentsRepository.list(submissionId)).items.map((c) => new CommentModel(c)),
  create: async (submissionId: string, body: CreateCommentBody) =>
    new CommentModel(await commentsRepository.create(submissionId, body)),
  update: async (id: string, body: UpdateCommentBody) =>
    new CommentModel(await commentsRepository.update(id, body)),
  remove: (id: string) => commentsRepository.remove(id),
};

function useInvalidateComments(submissionId: string) {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: qk.comments.bySubmission(submissionId) });
}

export const CommentsService = {
  ...api,

  useList: (submissionId: string | undefined) =>
    useQuery({
      queryKey: qk.comments.bySubmission(submissionId ?? ''),
      queryFn: () => api.list(submissionId!),
      enabled: !!submissionId,
    }),

  useCreate(submissionId: string) {
    const invalidate = useInvalidateComments(submissionId);
    return useMutation({
      mutationFn: (body: CreateCommentBody) => api.create(submissionId, body),
      onSuccess: invalidate,
    });
  },

  useUpdate(submissionId: string) {
    const invalidate = useInvalidateComments(submissionId);
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: UpdateCommentBody }) => api.update(id, body),
      onSuccess: invalidate,
    });
  },

  useRemove(submissionId: string) {
    const invalidate = useInvalidateComments(submissionId);
    return useMutation({ mutationFn: (id: string) => api.remove(id), onSuccess: invalidate });
  },
};
