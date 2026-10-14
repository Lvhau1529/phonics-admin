/** Service phiếu bài tập: repository → model */
import type { CreateWorksheetBody, UpdateWorksheetBody, WorksheetStructureBody } from '@phonics/contracts';
import { worksheetsRepository } from '@/features/worksheets/api/worksheetsRepository';
import { WorksheetModel, WorksheetSummaryModel } from '@/features/worksheets/models/WorksheetModel';
import type { QueryParams } from '@/shared/api/client';
import { mapPage } from '@/shared/api/pagination';

const toModel = (dto: ConstructorParameters<typeof WorksheetModel>[0]) => new WorksheetModel(dto);

export const worksheetsService = {
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
