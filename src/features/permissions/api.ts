import {
  ENDPOINTS,
  PermissionDefView,
  UserPermissionsResponse,
  type UpdateUserPermissionsBody,
} from '@phonics/contracts';
import { z } from 'zod';
import { request } from '@/shared/api/client';

const CatalogResponse = z.object({ items: z.array(PermissionDefView) });

export const permissionsApi = {
  catalog: () => request(ENDPOINTS.admin.permissions, { schema: CatalogResponse }),
  user: (userId: string) =>
    request(ENDPOINTS.admin.userPermissions(userId), { schema: UserPermissionsResponse }),
  update: (userId: string, body: UpdateUserPermissionsBody) =>
    request(ENDPOINTS.admin.userPermissions(userId), {
      method: 'PUT',
      body,
      schema: UserPermissionsResponse,
    }),
};
