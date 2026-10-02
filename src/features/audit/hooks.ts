import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/features/audit/api/auditService';
import type { QueryParams } from '@/shared/api/client';
import { qk } from '@/shared/api/queryKeys';

export const useAuditList = (params: QueryParams) =>
  useQuery({ queryKey: qk.audit.list(params), queryFn: () => auditService.list(params) });
