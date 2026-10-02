/** Service nhật ký thao tác: gọi `auditRepository` rồi đổi DTO → `AuditLogModel` */
import { auditRepository } from '@/features/audit/api/auditRepository';
import { AuditLogModel } from '@/features/audit/models/AuditLogModel';
import type { QueryParams } from '@/shared/api/client';
import { mapPage } from '@/shared/api/pagination';

export const auditService = {
  list: async (query: QueryParams) =>
    mapPage(await auditRepository.list(query), (log) => new AuditLogModel(log)),
};
