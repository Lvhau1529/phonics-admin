/**
 * Service duyệt tài khoản: đơn chờ → `PendingFamilyModel`; số đơn chờ (badge menu) và kết quả duyệt / từ chối / gộp
 * là response xác nhận → giữ DTO.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApproveFamilyBody, MergeFamilyBody, RejectFamilyBody } from '@phonics/contracts';
import { familiesRepository } from '@/features/families/api/familiesRepository';
import { PendingFamilyModel } from '@/features/families/models/PendingFamilyModel';
import { qk } from '@/shared/api/queryKeys';

/** Badge menu làm mới mỗi phút */
const PENDING_COUNT_REFETCH_MS = 60_000;

const api = {
  pending: async () => (await familiesRepository.pending()).items.map((f) => new PendingFamilyModel(f)),
  pendingCount: async () => (await familiesRepository.pendingCount()).count,
  approve: (id: string, body: ApproveFamilyBody) => familiesRepository.approve(id, body),
  reject: (id: string, body: RejectFamilyBody) => familiesRepository.reject(id, body),
  merge: (id: string, body: MergeFamilyBody) => familiesRepository.merge(id, body),
};

/** Sau khi xử lý đơn: làm mới đơn chờ + badge, học sinh / lớp (bé được duyệt vào lớp), phụ huynh */
function useInvalidateFamilies() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: qk.families.all });
    void qc.invalidateQueries({ queryKey: qk.students.all });
    void qc.invalidateQueries({ queryKey: qk.classes.all });
    void qc.invalidateQueries({ queryKey: qk.guardians.all });
  };
}

export const FamiliesService = {
  ...api,

  usePending: () => useQuery({ queryKey: qk.families.pending, queryFn: api.pending }),

  usePendingCount: (enabled: boolean) =>
    useQuery({
      queryKey: qk.families.pendingCount,
      queryFn: api.pendingCount,
      enabled,
      refetchInterval: PENDING_COUNT_REFETCH_MS,
    }),

  useApprove() {
    const invalidate = useInvalidateFamilies();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: ApproveFamilyBody }) => api.approve(id, body),
      onSuccess: invalidate,
    });
  },

  useReject() {
    const invalidate = useInvalidateFamilies();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: RejectFamilyBody }) => api.reject(id, body),
      onSuccess: invalidate,
    });
  },

  useMerge() {
    const invalidate = useInvalidateFamilies();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: MergeFamilyBody }) => api.merge(id, body),
      onSuccess: invalidate,
    });
  },
};
