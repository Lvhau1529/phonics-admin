/** Repository phiếu bài tập: endpoint + schema contracts, trả DTO như BE */
import {
  ENDPOINTS,
  WorksheetDetail,
  WorksheetSummary,
  paginated,
  type CreateWorksheetBody,
  type UpdateWorksheetBody,
  type WorksheetStructureBody,
} from '@phonics/contracts';
import { HttpMethod, request, type QueryParams } from '@/shared/api/client';

const WorksheetPage = paginated(WorksheetSummary);

export const worksheetsRepository = {
  list: (query: QueryParams) => request(ENDPOINTS.worksheets.list, { query, schema: WorksheetPage }),
  detail: (id: string) => request(ENDPOINTS.worksheets.detail(id), { schema: WorksheetDetail }),
  create: (body: CreateWorksheetBody) =>
    request(ENDPOINTS.worksheets.list, { method: HttpMethod.POST, body, schema: WorksheetDetail }),
  update: (id: string, body: UpdateWorksheetBody) =>
    request(ENDPOINTS.worksheets.detail(id), { method: HttpMethod.PATCH, body, schema: WorksheetDetail }),
  setStructure: (id: string, body: WorksheetStructureBody) =>
    request(ENDPOINTS.worksheets.structure(id), { method: HttpMethod.PUT, body, schema: WorksheetDetail }),
  publish: (id: string) =>
    request(ENDPOINTS.worksheets.publish(id), { method: HttpMethod.POST, schema: WorksheetDetail }),
  archive: (id: string) =>
    request(ENDPOINTS.worksheets.archive(id), { method: HttpMethod.POST, schema: WorksheetDetail }),
  duplicate: (id: string) =>
    request(ENDPOINTS.worksheets.duplicate(id), { method: HttpMethod.POST, schema: WorksheetDetail }),
};
