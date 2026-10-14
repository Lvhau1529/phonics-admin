/** Service câu hỏi: repository → model */
import type { CreateQuestionBody, QuestionView, UpdateQuestionBody } from '@phonics/contracts';
import { questionsRepository } from '@/features/questions/api/questionsRepository';
import { QuestionModel, QuestionSummaryModel } from '@/features/questions/models/QuestionModel';
import type { QueryParams } from '@/shared/api/client';
import { mapPage } from '@/shared/api/pagination';

const toModel = (dto: QuestionView) => new QuestionModel(dto);

export const questionsService = {
  list: async (query: QueryParams) =>
    mapPage(await questionsRepository.list(query), (q) => new QuestionSummaryModel(q)),
  /** Tag + số lượng (gợi ý nhập) → DTO */
  tags: () => questionsRepository.tags(),
  detail: async (id: string) => toModel(await questionsRepository.detail(id)),
  create: async (body: CreateQuestionBody) => toModel(await questionsRepository.create(body)),
  update: async (id: string, body: UpdateQuestionBody) => toModel(await questionsRepository.update(id, body)),
  publish: async (id: string) => toModel(await questionsRepository.publish(id)),
  archive: async (id: string) => toModel(await questionsRepository.archive(id)),
  duplicate: async (id: string) => toModel(await questionsRepository.duplicate(id)),
};
