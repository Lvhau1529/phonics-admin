/** Repository ngân hàng câu hỏi: chỉ khai báo endpoint + schema contracts, trả DTO như BE */
import {
  ENDPOINTS,
  QuestionSummary,
  QuestionView,
  TagsResponse,
  paginated,
  type CreateQuestionBody,
  type UpdateQuestionBody,
} from '@phonics/contracts';
import { HttpMethod, request, type QueryParams } from '@/shared/api/client';

const QuestionPage = paginated(QuestionSummary);

export const questionsRepository = {
  list: (query: QueryParams) => request(ENDPOINTS.questions.list, { query, schema: QuestionPage }),
  tags: () => request(ENDPOINTS.questions.tags, { schema: TagsResponse }),
  detail: (id: string) => request(ENDPOINTS.questions.detail(id), { schema: QuestionView }),
  create: (body: CreateQuestionBody) =>
    request(ENDPOINTS.questions.list, { method: HttpMethod.POST, body, schema: QuestionView }),
  update: (id: string, body: UpdateQuestionBody) =>
    request(ENDPOINTS.questions.detail(id), { method: HttpMethod.PATCH, body, schema: QuestionView }),
  publish: (id: string) =>
    request(ENDPOINTS.questions.publish(id), { method: HttpMethod.POST, schema: QuestionView }),
  archive: (id: string) =>
    request(ENDPOINTS.questions.archive(id), { method: HttpMethod.POST, schema: QuestionView }),
  duplicate: (id: string) =>
    request(ENDPOINTS.questions.duplicate(id), { method: HttpMethod.POST, schema: QuestionView }),
};
