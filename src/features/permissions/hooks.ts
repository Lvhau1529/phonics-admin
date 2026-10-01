import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateUserPermissionsBody } from '@phonics/contracts';
import { permissionsApi } from '@/features/permissions/api';
import { qk } from '@/shared/api/queryKeys';

export const usePermissionCatalog = () =>
  useQuery({
    queryKey: qk.permissions.catalog,
    queryFn: () => permissionsApi.catalog(),
    select: (data) => data.items,
    staleTime: Infinity,
  });

export const useUserPermissions = (userId: string | undefined) =>
  useQuery({
    queryKey: qk.permissions.user(userId ?? ''),
    queryFn: () => permissionsApi.user(userId!),
    enabled: !!userId,
  });

export function useUpdateUserPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: UpdateUserPermissionsBody }) =>
      permissionsApi.update(userId, body),
    onSuccess: (data) => qc.setQueryData(qk.permissions.user(data.userId), data),
  });
}
