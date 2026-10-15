/** Service nhật ký thao tác: gọi `auditRepository` rồi đổi DTO → `AuditLogModel`, kèm hook React Query */
import { useQuery } from '@tanstack/react-query';
import { auditRepository } from '@/features/audit/api/auditRepository';
import { AuditLogModel } from '@/features/audit/models/AuditLogModel';
import type { QueryParams } from '@/shared/api/client';
import { mapPage } from '@/shared/api/pagination';
import { qk } from '@/shared/api/queryKeys';

const api = {
  list: async (query: QueryParams) =>
    mapPage(await auditRepository.list(query), (log) => new AuditLogModel(log)),
};

export const AuditService = {
  ...api,

  useList: (params: QueryParams) =>
    useQuery({ queryKey: qk.audit.list(params), queryFn: () => api.list(params) }),
};
