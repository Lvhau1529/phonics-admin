import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  accountDeleteRepository,
  type DeleteTargetKind,
} from '@/features/account-delete/api/accountDeleteRepository';
import { qk } from '@/shared/api/queryKeys';

/** Preview trả thẳng DTO (danh sách đếm, không cần model) */
const api = {
  preview: accountDeleteRepository.preview,
  remove: accountDeleteRepository.remove,
};

export const AccountDeleteService = {
  ...api,

  /** Luôn đếm lại lúc mở hộp thoại (dữ liệu có thể vừa đổi) */
  usePreview: (kind: DeleteTargetKind, id: string | undefined) =>
    useQuery({
      queryKey: qk.accountDelete.preview(kind, id ?? ''),
      queryFn: () => api.preview(kind, id!),
      enabled: !!id,
      staleTime: 0,
      placeholderData: undefined,
    }),

  /**
   * Xoá xong: danh sách học sinh / giáo viên / phụ huynh và lớp (sĩ số) đều cũ. Bỏ qua query của chính đối tượng đã
   * xoá (trang chi tiết đang mở sẽ chuyển đi — gọi lại chỉ ra 404).
   */
  useRemove() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ kind, id }: { kind: DeleteTargetKind; id: string }) => api.remove(kind, id),
      onSuccess: (_res, { id }) => {
        for (const queryKey of [qk.students.all, qk.teachers.all, qk.guardians.all, qk.classes.all])
          void qc.invalidateQueries({ queryKey, predicate: (q) => !q.queryKey.includes(id) });
      },
    });
  },
};
