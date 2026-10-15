/** Service phiếu bài tập: repository → model, kèm hook React Query (`WorksheetsService.useList(...)`) */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateWorksheetBody, UpdateWorksheetBody, WorksheetStructureBody } from '@phonics/contracts';
import { worksheetsRepository } from '@/features/worksheets/api/worksheetsRepository';
import { WorksheetModel, WorksheetSummaryModel } from '@/features/worksheets/models/WorksheetModel';
import type { QueryParams } from '@/shared/api/client';
import { mapPage } from '@/shared/api/pagination';
import { qk } from '@/shared/api/queryKeys';

const toModel = (dto: ConstructorParameters<typeof WorksheetModel>[0]) => new WorksheetModel(dto);

const api = {
  list: async (query: QueryParams) =>
    mapPage(await worksheetsRepository.list(query), (w) => new WorksheetSummaryModel(w)),
  detail: async (id: string) => toModel(await worksheetsRepository.detail(id)),
  create: async (body: CreateWorksheetBody) => toModel(await worksheetsRepository.create(body)),
  update: async (id: string, body: UpdateWorksheetBody) =>
    toModel(await worksheetsRepository.update(id, body)),
  setStructure: async (id: string, body: WorksheetStructureBody) =>
    toModel(await worksheetsRepository.setStructure(id, body)),
  publish: async (id: string) => toModel(await worksheetsRepository.publish(id)),
  archive: async (id: string) => toModel(await worksheetsRepository.archive(id)),
  duplicate: async (id: string) => toModel(await worksheetsRepository.duplicate(id)),
};

function useInvalidateWorksheets() {
  const qc = useQueryClient();
  return (ws?: WorksheetModel) => {
    void qc.invalidateQueries({ queryKey: qk.worksheets.all });
    void qc.invalidateQueries({ queryKey: qk.questions.all });
    if (ws) qc.setQueryData(qk.worksheets.detail(ws.id), ws);
  };
}

export const WorksheetsService = {
  ...api,

  useList: (params: QueryParams) =>
    useQuery({ queryKey: qk.worksheets.list(params), queryFn: () => api.list(params) }),

  /** Phiếu đã phát hành (≤100) cho ô chọn khi giao bài */
  useOptions() {
    const params: QueryParams = { pageSize: 100, status: 'PUBLISHED', sort: 'updatedAt:desc' };
    return useQuery({
      queryKey: qk.worksheets.list(params),
      queryFn: () => api.list(params),
      select: (data) => data.items,
      staleTime: 60_000,
    });
  },

  useDetail: (id: string | undefined) =>
    useQuery({
      queryKey: qk.worksheets.detail(id ?? ''),
      queryFn: () => api.detail(id!),
      enabled: !!id,
    }),

  useCreate() {
    const invalidate = useInvalidateWorksheets();
    return useMutation({
      mutationFn: (body: CreateWorksheetBody) => api.create(body),
      onSuccess: (ws) => invalidate(ws),
    });
  },

  useUpdate() {
    const invalidate = useInvalidateWorksheets();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: UpdateWorksheetBody }) => api.update(id, body),
      onSuccess: (ws) => invalidate(ws),
    });
  },

  useSetStructure() {
    const invalidate = useInvalidateWorksheets();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: WorksheetStructureBody }) => api.setStructure(id, body),
      onSuccess: (ws) => invalidate(ws),
    });
  },

  usePublish() {
    const invalidate = useInvalidateWorksheets();
    return useMutation({
      mutationFn: (id: string) => api.publish(id),
      onSuccess: (ws) => invalidate(ws),
    });
  },

  useArchive() {
    const invalidate = useInvalidateWorksheets();
    return useMutation({
      mutationFn: (id: string) => api.archive(id),
      onSuccess: (ws) => invalidate(ws),
    });
  },

  useDuplicate() {
    const invalidate = useInvalidateWorksheets();
    return useMutation({
      mutationFn: (id: string) => api.duplicate(id),
      onSuccess: (ws) => invalidate(ws),
    });
  },
};
