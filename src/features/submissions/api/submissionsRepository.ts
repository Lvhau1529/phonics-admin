/** Repository bài nộp (phía giáo viên) */
import { ENDPOINTS, SubmissionDetail, type GradeSubmissionBody } from '@phonics/contracts';
import { HttpMethod, request } from '@/shared/api/client';

export const submissionsRepository = {
  detail: (id: string) => request(ENDPOINTS.submissions.detail(id), { schema: SubmissionDetail }),
  grade: (id: string, body: GradeSubmissionBody) =>
    request(ENDPOINTS.submissions.grade(id), { method: HttpMethod.PUT, body, schema: SubmissionDetail }),
  reopen: (id: string) =>
    request(ENDPOINTS.submissions.reopen(id), { method: HttpMethod.POST, schema: SubmissionDetail }),
};
