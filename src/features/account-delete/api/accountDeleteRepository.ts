/** Repository xoá hẳn tài khoản tạo nhầm (admin): xem trước ảnh hưởng + xoá */
import { DeletePreview, ENDPOINTS } from '@phonics/contracts';
import { HttpMethod, request } from '@/shared/api/client';

export type DeleteTargetKind = 'student' | 'teacher' | 'guardian';

const PATHS = {
  student: { detail: ENDPOINTS.students.detail, preview: ENDPOINTS.students.deletePreview },
  teacher: { detail: ENDPOINTS.admin.teacher, preview: ENDPOINTS.admin.teacherDeletePreview },
  guardian: { detail: ENDPOINTS.guardians.detail, preview: ENDPOINTS.guardians.deletePreview },
} satisfies Record<DeleteTargetKind, { detail: (id: string) => string; preview: (id: string) => string }>;

export const accountDeleteRepository = {
  preview: (kind: DeleteTargetKind, id: string) =>
    request(PATHS[kind].preview(id), { schema: DeletePreview }),
  remove: (kind: DeleteTargetKind, id: string) =>
    request<void>(PATHS[kind].detail(id), { method: HttpMethod.DELETE }),
};
