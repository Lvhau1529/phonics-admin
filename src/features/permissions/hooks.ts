import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreatePermissionGroupBody,
  SetUserPermissionGroupsBody,
  UpdatePermissionGroupBody,
  UpdateUserPermissionsBody,
} from '@phonics/contracts';
import { permissionsService } from '@/features/permissions/api/permissionsService';
import { qk } from '@/shared/api/queryKeys';

export const usePermissionCatalog = () =>
  useQuery({
    queryKey: qk.permissions.catalog,
    queryFn: () => permissionsService.catalog(),
    staleTime: Infinity,
  });

export const useUserPermissions = (userId: string | undefined) =>
  useQuery({
    queryKey: qk.permissions.user(userId ?? ''),
    queryFn: () => permissionsService.user(userId!),
    enabled: !!userId,
  });

export function useUpdateUserPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: UpdateUserPermissionsBody }) =>
      permissionsService.update(userId, body),
    onSuccess: (data) => qc.setQueryData(qk.permissions.user(data.userId), data),
  });
}

/** Danh sách nhóm quyền (ít, không phân trang) */
export const usePermissionGroups = () =>
  useQuery({
    queryKey: qk.permissions.groups,
    queryFn: () => permissionsService.groups(),
    staleTime: 60_000,
  });

function useInvalidateGroups() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: qk.permissions.groups });
    // Quyền hiệu lực của user đổi theo nhóm → làm mới ma trận đang mở (và nhật ký)
    void qc.invalidateQueries({ queryKey: qk.permissions.users });
    void qc.invalidateQueries({ queryKey: qk.audit.all });
  };
}

export function useCreatePermissionGroup() {
  const invalidate = useInvalidateGroups();
  return useMutation({
    mutationFn: (body: CreatePermissionGroupBody) => permissionsService.createGroup(body),
    onSuccess: invalidate,
  });
}

export function useUpdatePermissionGroup() {
  const invalidate = useInvalidateGroups();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePermissionGroupBody }) =>
      permissionsService.updateGroup(id, body),
    onSuccess: invalidate,
  });
}

export function useDeletePermissionGroup() {
  const invalidate = useInvalidateGroups();
  return useMutation({
    mutationFn: (id: string) => permissionsService.deleteGroup(id),
    onSuccess: invalidate,
  });
}

/** Gán nhóm quyền cho user; response là quyền hiệu lực mới → ghi thẳng vào cache, memberCount đổi → làm mới nhóm */
export function useSetUserPermissionGroups() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: SetUserPermissionGroupsBody }) =>
      permissionsService.setUserGroups(userId, body),
    onSuccess: (data) => {
      qc.setQueryData(qk.permissions.user(data.userId), data);
      void qc.invalidateQueries({ queryKey: qk.permissions.groups });
      void qc.invalidateQueries({ queryKey: qk.audit.all });
    },
  });
}
