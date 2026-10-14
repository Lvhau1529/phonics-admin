/** Service bài giao: repository → model; roster / ranking / dashboard là số liệu → giữ DTO */
import type { CreateAssignmentBody, UpdateAssignmentBody } from '@phonics/contracts';
import { assignmentsRepository } from '@/features/assignments/api/assignmentsRepository';
import { AssignmentDetailModel, AssignmentModel } from '@/features/assignments/models/AssignmentModel';
import type { QueryParams } from '@/shared/api/client';
import { mapPage } from '@/shared/api/pagination';

const toDetail = (dto: ConstructorParameters<typeof AssignmentDetailModel>[0]) =>
  new AssignmentDetailModel(dto);

export const assignmentsService = {
  list: async (query: QueryParams) =>
    mapPage(await assignmentsRepository.list(query), (a) => new AssignmentModel(a)),
  dashboard: async () => {
    const d = await assignmentsRepository.dashboard();
    return { ...d, dueToday: d.dueToday.map((a) => new AssignmentModel(a)) };
  },
  detail: async (id: string) => toDetail(await assignmentsRepository.detail(id)),
  create: async (body: CreateAssignmentBody) => toDetail(await assignmentsRepository.create(body)),
  update: async (id: string, body: UpdateAssignmentBody) =>
    toDetail(await assignmentsRepository.update(id, body)),
  remove: (id: string) => assignmentsRepository.remove(id),
  close: async (id: string) => toDetail(await assignmentsRepository.close(id)),
  reopen: async (id: string) => toDetail(await assignmentsRepository.reopen(id)),
  roster: (id: string) => assignmentsRepository.roster(id),
  ranking: (id: string) => assignmentsRepository.ranking(id),
};
