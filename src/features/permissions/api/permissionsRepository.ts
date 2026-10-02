/**
 * Repository phân quyền: chỉ khai báo endpoint (đường dẫn `ENDPOINTS`, method, body, schema contracts) và trả DTO
 * đúng như BE. Không map / format ở đây — việc đó của `permissionsService`.
 */
import {
  ENDPOINTS,
  PermissionDefView,
  PermissionGroup,
  PermissionGroupsResponse,
  UserPermissionsResponse,
  type CreatePermissionGroupBody,
  type SetUserPermissionGroupsBody,
  type UpdatePermissionGroupBody,
  type UpdateUserPermissionsBody,
} from '@phonics/contracts';
import { z } from 'zod';
import { request } from '@/shared/api/client';

const CatalogResponse = z.object({ items: z.array(PermissionDefView) });

export const permissionsRepository = {
  catalog: () => request(ENDPOINTS.admin.permissions, { schema: CatalogResponse }),
  user: (userId: string) =>
    request(ENDPOINTS.admin.userPermissions(userId), { schema: UserPermissionsResponse }),
  update: (userId: string, body: UpdateUserPermissionsBody) =>
    request(ENDPOINTS.admin.userPermissions(userId), {
      method: 'PUT',
      body,
      schema: UserPermissionsResponse,
    }),
  /** Thay toàn bộ nhóm quyền của user → trả lại quyền hiệu lực mới */
  setUserGroups: (userId: string, body: SetUserPermissionGroupsBody) =>
    request(ENDPOINTS.admin.userPermissionGroups(userId), {
      method: 'PUT',
      body,
      schema: UserPermissionsResponse,
    }),

  groups: () => request(ENDPOINTS.admin.permissionGroups, { schema: PermissionGroupsResponse }),
  createGroup: (body: CreatePermissionGroupBody) =>
    request(ENDPOINTS.admin.permissionGroups, { method: 'POST', body, schema: PermissionGroup }),
  updateGroup: (id: string, body: UpdatePermissionGroupBody) =>
    request(ENDPOINTS.admin.permissionGroup(id), { method: 'PATCH', body, schema: PermissionGroup }),
  /** 204; nhóm hệ thống → 403 */
  deleteGroup: (id: string) => request<void>(ENDPOINTS.admin.permissionGroup(id), { method: 'DELETE' }),
};
