/**
 * Service phụ huynh: DTO → `GuardianModel` / `StudentGuardianModel` + hook React Query. Xem trước / kết quả chuyển
 * sang tài khoản gia đình và kết quả tạo tài khoản là response xác nhận → giữ DTO (kèm model phụ huynh khi cần).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateGuardianBody, SetStudentGuardiansBody, UpdateGuardianBody } from '@phonics/contracts';
import { guardiansRepository } from '@/features/guardians/api/guardiansRepository';
import { GuardianModel, StudentGuardianModel } from '@/features/guardians/models/GuardianModel';
import type { QueryParams } from '@/shared/api/client';
import { mapPage } from '@/shared/api/pagination';
import { qk } from '@/shared/api/queryKeys';

/** Số phụ huynh tối đa trả về cho ô chọn */
const OPTIONS_LIMIT = 20;

const api = {
  list: async (query: QueryParams) =>
    mapPage(await guardiansRepository.list(query), (g) => new GuardianModel(g)),
  detail: async (id: string) => new GuardianModel(await guardiansRepository.detail(id)),
  create: async (body: CreateGuardianBody) => new GuardianModel(await guardiansRepository.create(body)),
  update: async (id: string, body: UpdateGuardianBody) =>
    new GuardianModel(await guardiansRepository.update(id, body)),
  createFamilyAccount: async (id: string) => {
    const res = await guardiansRepository.createFamilyAccount(id);
    return { guardian: new GuardianModel(res.guardian), inviteSent: res.inviteSent };
  },
  setStudentGuardians: async (studentId: string, body: SetStudentGuardiansBody) =>
    (await guardiansRepository.setStudentGuardians(studentId, body)).items.map(
      (g) => new StudentGuardianModel(g),
    ),
};

/** Phụ huynh đổi → danh sách / chi tiết phụ huynh và chi tiết học sinh (thẻ Phụ huynh) đều cũ */
function useInvalidateGuardians() {
  const qc = useQueryClient();
  return (guardian?: GuardianModel) => {
    void qc.invalidateQueries({ queryKey: qk.guardians.all });
    void qc.invalidateQueries({ queryKey: qk.students.all });
    if (guardian) qc.setQueryData(qk.guardians.detail(guardian.id), guardian);
  };
}

export const GuardiansService = {
  ...api,

  useList: (params: QueryParams) =>
    useQuery({ queryKey: qk.guardians.list(params), queryFn: () => api.list(params) }),

  /** Ô chọn phụ huynh: tìm phía server theo tên / email / SĐT */
  useOptions: (q: string) => {
    const params: QueryParams = { q: q || undefined, pageSize: OPTIONS_LIMIT };
    return useQuery({
      queryKey: qk.guardians.list(params),
      queryFn: () => api.list(params),
      select: (data) => data.items,
    });
  },

  useDetail: (id: string | undefined) =>
    useQuery({ queryKey: qk.guardians.detail(id ?? ''), queryFn: () => api.detail(id!), enabled: !!id }),

  useCreate() {
    const invalidate = useInvalidateGuardians();
    return useMutation({ mutationFn: api.create, onSuccess: (g) => invalidate(g) });
  },

  useUpdate() {
    const invalidate = useInvalidateGuardians();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: UpdateGuardianBody }) => api.update(id, body),
      onSuccess: (g) => invalidate(g),
    });
  },

  useCreateFamilyAccount() {
    const invalidate = useInvalidateGuardians();
    return useMutation({ mutationFn: api.createFamilyAccount, onSuccess: (res) => invalidate(res.guardian) });
  },

  useSetStudentGuardians() {
    const invalidate = useInvalidateGuardians();
    return useMutation({
      mutationFn: ({ studentId, body }: { studentId: string; body: SetStudentGuardiansBody }) =>
        api.setStudentGuardians(studentId, body),
      onSuccess: () => invalidate(),
    });
  },
};
