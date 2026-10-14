/** Service nhận xét: repository → CommentModel */
import type { CreateCommentBody, UpdateCommentBody } from '@phonics/contracts';
import { commentsRepository } from '@/features/comments/api/commentsRepository';
import { CommentModel } from '@/features/comments/models/CommentModel';

export const commentsService = {
  list: async (submissionId: string) =>
    (await commentsRepository.list(submissionId)).items.map((c) => new CommentModel(c)),
  create: async (submissionId: string, body: CreateCommentBody) =>
    new CommentModel(await commentsRepository.create(submissionId, body)),
  update: async (id: string, body: UpdateCommentBody) =>
    new CommentModel(await commentsRepository.update(id, body)),
  remove: (id: string) => commentsRepository.remove(id),
};
