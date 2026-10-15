/**
 * Service phân quyền: gọi `permissionsRepository` rồi đổi DTO → model (`PermissionGroupModel`,
 * `UserPermissionsModel`). Catalog quyền là định nghĩa tĩnh → giữ DTO. Kèm hook React Query.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { qk } from '@/shared/api/queryKeys';

const toGroup = (data: PermissionGroup) => new PermissionGroupModel(data);
const toUserPermissions = (data: UserPermissionsResponse) => new UserPermissionsModel(data);

const api = {
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

function useInvalidateGroups() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: qk.permissions.groups });
    // Quyền hiệu lực của user đổi theo nhóm → làm mới ma trận đang mở (và nhật ký)
    void qc.invalidateQueries({ queryKey: qk.permissions.users });
    void qc.invalidateQueries({ queryKey: qk.audit.all });
  };
}

export const PermissionsService = {
  ...api,

  useCatalog: () =>
    useQuery({
      queryKey: qk.permissions.catalog,
      queryFn: () => api.catalog(),
      staleTime: Infinity,
    }),

  useUser: (userId: string | undefined) =>
    useQuery({
      queryKey: qk.permissions.user(userId ?? ''),
      queryFn: () => api.user(userId!),
      enabled: !!userId,
    }),

  useUpdate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ userId, body }: { userId: string; body: UpdateUserPermissionsBody }) =>
        api.update(userId, body),
      onSuccess: (data) => qc.setQueryData(qk.permissions.user(data.userId), data),
    });
  },

  /** Danh sách nhóm quyền (ít, không phân trang) */
  useGroups: () =>
    useQuery({
      queryKey: qk.permissions.groups,
      queryFn: () => api.groups(),
      staleTime: 60_000,
    }),

  useCreateGroup() {
    const invalidate = useInvalidateGroups();
    return useMutation({
      mutationFn: (body: CreatePermissionGroupBody) => api.createGroup(body),
      onSuccess: invalidate,
    });
  },

  useUpdateGroup() {
    const invalidate = useInvalidateGroups();
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: UpdatePermissionGroupBody }) =>
        api.updateGroup(id, body),
      onSuccess: invalidate,
    });
  },

  useDeleteGroup() {
    const invalidate = useInvalidateGroups();
    return useMutation({
      mutationFn: (id: string) => api.deleteGroup(id),
      onSuccess: invalidate,
    });
  },

  /** Gán nhóm quyền cho user; response là quyền hiệu lực mới → ghi thẳng vào cache, memberCount đổi → làm mới nhóm */
  useSetUserGroups() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ userId, body }: { userId: string; body: SetUserPermissionGroupsBody }) =>
        api.setUserGroups(userId, body),
      onSuccess: (data) => {
        qc.setQueryData(qk.permissions.user(data.userId), data);
        void qc.invalidateQueries({ queryKey: qk.permissions.groups });
        void qc.invalidateQueries({ queryKey: qk.audit.all });
      },
    });
  },
};
