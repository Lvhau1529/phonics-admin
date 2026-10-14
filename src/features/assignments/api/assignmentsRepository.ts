/** Repository bài giao: endpoint + schema contracts */
import {
  AssignmentDetail,
  AssignmentRankingResponse,
  AssignmentRosterResponse,
  AssignmentSummary,
  AssignmentsDashboard,
  ENDPOINTS,
  paginated,
  type CreateAssignmentBody,
  type UpdateAssignmentBody,
} from '@phonics/contracts';
import { HttpMethod, request, type QueryParams } from '@/shared/api/client';

const AssignmentPage = paginated(AssignmentSummary);

export const assignmentsRepository = {
  list: (query: QueryParams) => request(ENDPOINTS.assignments.list, { query, schema: AssignmentPage }),
  dashboard: () => request(ENDPOINTS.assignments.dashboard, { schema: AssignmentsDashboard }),
  detail: (id: string) => request(ENDPOINTS.assignments.detail(id), { schema: AssignmentDetail }),
  create: (body: CreateAssignmentBody) =>
    request(ENDPOINTS.assignments.list, { method: HttpMethod.POST, body, schema: AssignmentDetail }),
  update: (id: string, body: UpdateAssignmentBody) =>
    request(ENDPOINTS.assignments.detail(id), { method: HttpMethod.PATCH, body, schema: AssignmentDetail }),
  remove: (id: string) => request<void>(ENDPOINTS.assignments.detail(id), { method: HttpMethod.DELETE }),
  close: (id: string) =>
    request(ENDPOINTS.assignments.close(id), { method: HttpMethod.POST, schema: AssignmentDetail }),
  reopen: (id: string) =>
    request(ENDPOINTS.assignments.reopen(id), { method: HttpMethod.POST, schema: AssignmentDetail }),
  roster: (id: string) =>
    request(ENDPOINTS.assignments.submissions(id), { schema: AssignmentRosterResponse }),
  ranking: (id: string) => request(ENDPOINTS.assignments.ranking(id), { schema: AssignmentRankingResponse }),
};
