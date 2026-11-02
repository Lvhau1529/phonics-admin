import type { UserStatus } from '@phonics/contracts';

/** Trạng thái admin chọn tay ở form sửa (chờ duyệt / bị từ chối chỉ đổi qua màn Duyệt tài khoản) */
export const EDITABLE_STATUSES = ['ACTIVE', 'DISABLED'] as const satisfies readonly UserStatus[];

export const isEditableStatus = (status: UserStatus): boolean =>
  (EDITABLE_STATUSES as readonly UserStatus[]).includes(status);
