/**
 * Repository nhật ký thao tác: chỉ khai báo endpoint (đường dẫn `ENDPOINTS`, schema contracts) và trả DTO đúng
 * như BE. Không map / format ở đây — việc đó của `auditService`.
 */
import { AuditLogView, ENDPOINTS, paginated } from '@phonics/contracts';
import { request, type QueryParams } from '@/shared/api/client';

const AuditPage = paginated(AuditLogView);

export const auditRepository = {
  list: (query: QueryParams) => request(ENDPOINTS.admin.audit, { query, schema: AuditPage }),
};
