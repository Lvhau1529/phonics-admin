/** Repository nhận xét trên bài nộp (phía giáo viên) */
import {
  CommentView,
  CommentsResponse,
  ENDPOINTS,
  type CreateCommentBody,
  type UpdateCommentBody,
} from '@phonics/contracts';
import { HttpMethod, request } from '@/shared/api/client';

export const commentsRepository = {
  list: (submissionId: string) =>
    request(ENDPOINTS.submissions.comments(submissionId), { schema: CommentsResponse }),
  create: (submissionId: string, body: CreateCommentBody) =>
    request(ENDPOINTS.submissions.comments(submissionId), {
      method: HttpMethod.POST,
      body,
      schema: CommentView,
    }),
  update: (id: string, body: UpdateCommentBody) =>
    request(ENDPOINTS.comments.detail(id), { method: HttpMethod.PATCH, body, schema: CommentView }),
  remove: (id: string) => request<void>(ENDPOINTS.comments.detail(id), { method: HttpMethod.DELETE }),
};
