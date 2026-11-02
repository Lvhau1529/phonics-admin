/**
 * Repository duyệt tài khoản: chỉ khai báo endpoint (`ENDPOINTS.families`) + schema contracts, trả DTO đúng như BE.
 */
import {
  ENDPOINTS,
  FamilyReviewResult,
  PendingCountResponse,
  PendingFamiliesResponse,
  type ApproveFamilyBody,
  type MergeFamilyBody,
  type RejectFamilyBody,
} from '@phonics/contracts';
import { HttpMethod, request } from '@/shared/api/client';

export const familiesRepository = {
  pending: () => request(ENDPOINTS.families.pending, { schema: PendingFamiliesResponse }),
  pendingCount: () => request(ENDPOINTS.families.pendingCount, { schema: PendingCountResponse }),
  approve: (id: string, body: ApproveFamilyBody) =>
    request(ENDPOINTS.families.approve(id), { method: HttpMethod.POST, body, schema: FamilyReviewResult }),
  reject: (id: string, body: RejectFamilyBody) =>
    request(ENDPOINTS.families.reject(id), { method: HttpMethod.POST, body, schema: FamilyReviewResult }),
  merge: (id: string, body: MergeFamilyBody) =>
    request(ENDPOINTS.families.merge(id), { method: HttpMethod.POST, body, schema: FamilyReviewResult }),
};
