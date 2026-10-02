/**
 * Service phân quyền: gọi `permissionsRepository` rồi đổi DTO → model (`PermissionGroupModel`,
 * `UserPermissionsModel`). Catalog quyền là định nghĩa tĩnh → giữ DTO.
 */
import type {
  CreatePermissionGroupBody,
  PermissionGroup,
  SetUserPermissionGroupsBody,
  UpdatePermissionGroupBody,
  UpdateUserPermissionsBody,
  UserPermissionsResponse,
} from '@phonics/contracts';
import { permissionsRepository } from '@/features/permissions/api/permissionsRepository';
import { PermissionGroupModel } from '@/features/permissions/models/PermissionGroupModel';
import { UserPermissionsModel } from '@/features/permissions/models/UserPermissionsModel';

const toGroup = (data: PermissionGroup) => new PermissionGroupModel(data);
const toUserPermissions = (data: UserPermissionsResponse) => new UserPermissionsModel(data);

export const permissionsService = {
  catalog: async () => (await permissionsRepository.catalog()).items,
  user: async (userId: string) => toUserPermissions(await permissionsRepository.user(userId)),
  update: async (userId: string, body: UpdateUserPermissionsBody) =>
    toUserPermissions(await permissionsRepository.update(userId, body)),
  setUserGroups: async (userId: string, body: SetUserPermissionGroupsBody) =>
    toUserPermissions(await permissionsRepository.setUserGroups(userId, body)),

  groups: async () => (await permissionsRepository.groups()).items.map(toGroup),
  createGroup: async (body: CreatePermissionGroupBody) =>
    toGroup(await permissionsRepository.createGroup(body)),
  updateGroup: async (id: string, body: UpdatePermissionGroupBody) =>
    toGroup(await permissionsRepository.updateGroup(id, body)),
  deleteGroup: (id: string) => permissionsRepository.deleteGroup(id),
};
