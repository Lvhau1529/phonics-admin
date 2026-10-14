import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateWorksheetBody, UpdateWorksheetBody, WorksheetStructureBody } from '@phonics/contracts';
import { worksheetsService } from '@/features/worksheets/api/worksheetsService';
import type { WorksheetModel } from '@/features/worksheets/models/WorksheetModel';
import type { QueryParams } from '@/shared/api/client';
import { qk } from '@/shared/api/queryKeys';

export const useWorksheetsList = (params: QueryParams) =>
  useQuery({ queryKey: qk.worksheets.list(params), queryFn: () => worksheetsService.list(params) });

/** Phiếu đã phát hành (≤100) cho ô chọn khi giao bài */
export function useWorksheetOptions() {
  const params: QueryParams = { pageSize: 100, status: 'PUBLISHED', sort: 'updatedAt:desc' };
  return useQuery({
    queryKey: qk.worksheets.list(params),
    queryFn: () => worksheetsService.list(params),
    select: (data) => data.items,
    staleTime: 60_000,
  });
}

export const useWorksheet = (id: string | undefined) =>
  useQuery({
    queryKey: qk.worksheets.detail(id ?? ''),
    queryFn: () => worksheetsService.detail(id!),
    enabled: !!id,
  });

function useInvalidateWorksheets() {
  const qc = useQueryClient();
  return (ws?: WorksheetModel) => {
    void qc.invalidateQueries({ queryKey: qk.worksheets.all });
    void qc.invalidateQueries({ queryKey: qk.questions.all });
    if (ws) qc.setQueryData(qk.worksheets.detail(ws.id), ws);
  };
}

export function useCreateWorksheet() {
  const invalidate = useInvalidateWorksheets();
  return useMutation({
    mutationFn: (body: CreateWorksheetBody) => worksheetsService.create(body),
    onSuccess: (ws) => invalidate(ws),
  });
}

export function useUpdateWorksheet() {
  const invalidate = useInvalidateWorksheets();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateWorksheetBody }) =>
      worksheetsService.update(id, body),
    onSuccess: (ws) => invalidate(ws),
  });
}

export function useSetWorksheetStructure() {
  const invalidate = useInvalidateWorksheets();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: WorksheetStructureBody }) =>
      worksheetsService.setStructure(id, body),
    onSuccess: (ws) => invalidate(ws),
  });
}

export function usePublishWorksheet() {
  const invalidate = useInvalidateWorksheets();
  return useMutation({
    mutationFn: (id: string) => worksheetsService.publish(id),
    onSuccess: (ws) => invalidate(ws),
  });
}

export function useArchiveWorksheet() {
  const invalidate = useInvalidateWorksheets();
  return useMutation({
    mutationFn: (id: string) => worksheetsService.archive(id),
    onSuccess: (ws) => invalidate(ws),
  });
}

export function useDuplicateWorksheet() {
  const invalidate = useInvalidateWorksheets();
  return useMutation({
    mutationFn: (id: string) => worksheetsService.duplicate(id),
    onSuccess: (ws) => invalidate(ws),
  });
}
