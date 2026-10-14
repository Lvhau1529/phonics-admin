/** Service bài nộp: repository → SubmissionModel */
import type { GradeSubmissionBody } from '@phonics/contracts';
import { submissionsRepository } from '@/features/submissions/api/submissionsRepository';
import { SubmissionModel } from '@/features/submissions/models/SubmissionModel';

export const submissionsService = {
  detail: async (id: string) => new SubmissionModel(await submissionsRepository.detail(id)),
  grade: async (id: string, body: GradeSubmissionBody) =>
    new SubmissionModel(await submissionsRepository.grade(id, body)),
  reopen: async (id: string) => new SubmissionModel(await submissionsRepository.reopen(id)),
};
