import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateQuestionBody, UpdateQuestionBody } from '@phonics/contracts';
import { questionsService } from '@/features/questions/api/questionsService';
import type { QuestionModel } from '@/features/questions/models/QuestionModel';
import type { QueryParams } from '@/shared/api/client';
import { qk } from '@/shared/api/queryKeys';

export const useQuestionsList = (params: QueryParams) =>
  useQuery({ queryKey: qk.questions.list(params), queryFn: () => questionsService.list(params) });

export const useQuestionTags = () =>
  useQuery({ queryKey: qk.questions.tags, queryFn: questionsService.tags, staleTime: 5 * 60_000 });

export const useQuestion = (id: string | undefined) =>
  useQuery({
    queryKey: qk.questions.detail(id ?? ''),
    queryFn: () => questionsService.detail(id!),
    enabled: !!id,
  });

/** Câu hỏi đổi → danh sách câu, phiếu (nhúng summary) và tag đều cần làm mới */
function useInvalidateQuestions() {
  const qc = useQueryClient();
  return (q?: QuestionModel) => {
    void qc.invalidateQueries({ queryKey: qk.questions.all });
    void qc.invalidateQueries({ queryKey: qk.worksheets.all });
    if (q) qc.setQueryData(qk.questions.detail(q.id), q);
  };
}

export function useCreateQuestion() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (body: CreateQuestionBody) => questionsService.create(body),
    onSuccess: (q) => invalidate(q),
  });
}

export function useUpdateQuestion() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateQuestionBody }) => questionsService.update(id, body),
    onSuccess: (q) => invalidate(q),
  });
}

export function usePublishQuestion() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (id: string) => questionsService.publish(id),
    onSuccess: (q) => invalidate(q),
  });
}

export function useArchiveQuestion() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (id: string) => questionsService.archive(id),
    onSuccess: (q) => invalidate(q),
  });
}

export function useDuplicateQuestion() {
  const invalidate = useInvalidateQuestions();
  return useMutation({
    mutationFn: (id: string) => questionsService.duplicate(id),
    onSuccess: (q) => invalidate(q),
  });
}
