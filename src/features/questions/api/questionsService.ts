/** Service câu hỏi: repository → model, kèm hook React Query (`QuestionsService.useList(...)`) */
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateQuestionBody, QuestionView, UpdateQuestionBody } from '@phonics/contracts';
import { questionsRepository } from '@/features/questions/api/questionsRepository';
import { QuestionModel, QuestionSummaryModel } from '@/features/questions/models/QuestionModel';
import type { QueryParams } from '@/shared/api/client';
import { mapPage } from '@/shared/api/pagination';
import { qk } from '@/shared/api/queryKeys';

const toModel = (dto: QuestionView) => new QuestionModel(dto);

const api = {
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

/** Câu hỏi đổi → danh sách câu, phiếu (nhúng summary) và tag đều cần làm mới */
function useInvalidateQuestions() {
  const qc = useQueryClient();
  return (q?: QuestionModel) => {
    void qc.invalidateQueries({ queryKey: qk.questions.all });
    void qc.invalidateQueries({ queryKey: qk.worksheets.all });
    if (q) qc.setQueryData(qk.questions.detail(q.id), q);
  };
}

export const QuestionsService = {
  ...api,

  useList: (params: QueryParams) =>
    useQuery({ queryKey: qk.questions.list(params), queryFn: () => api.list(params) }),

  useTags: () => useQuery({ queryKey: qk.questions.tags, queryFn: api.tags, staleTime: 5 * 60_000 }),

  useDetail: (id: string | undefined) =>
    useQuery({
      queryKey: qk.questions.detail(id ?? ''),
      queryFn: () => api.detail(id!),
      enabled: !!id,
    }),

  /** Nhiều câu đầy đủ (vd câu vừa thêm vào phiếu chưa lưu) — chung cache với useDetail */
  useDetails: (ids: string[]) =>
    useQueries({
      queries: ids.map((id) => ({ queryKey: qk.questions.detail(id), queryFn: () => api.detail(id) })),
    }),

  useCreate() {
    const invalidate = useInvalidateQuestions();
    return useMutation({
      mutationFn: (body: CreateQuestionBody) => api.create(body),
      onSuccess: (q) => invalidate(q),
    });
  },

  useUpdate() {
    const invalidate = useInvalidateQuestions();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: UpdateQuestionBody }) => api.update(id, body),
      onSuccess: (q) => invalidate(q),
    });
  },

  usePublish() {
    const invalidate = useInvalidateQuestions();
    return useMutation({
      mutationFn: (id: string) => api.publish(id),
      onSuccess: (q) => invalidate(q),
    });
  },

  useArchive() {
    const invalidate = useInvalidateQuestions();
    return useMutation({
      mutationFn: (id: string) => api.archive(id),
      onSuccess: (q) => invalidate(q),
    });
  },

  useDuplicate() {
    const invalidate = useInvalidateQuestions();
    return useMutation({
      mutationFn: (id: string) => api.duplicate(id),
      onSuccess: (q) => invalidate(q),
    });
  },
};
