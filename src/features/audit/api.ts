import { AuditLogView, ENDPOINTS, paginated } from '@phonics/contracts';
import { request, type QueryParams } from '@/shared/api/client';

const AuditPage = paginated(AuditLogView);

export const auditApi = {
  list: (query: QueryParams) => request(ENDPOINTS.admin.audit, { query, schema: AuditPage }),
};
