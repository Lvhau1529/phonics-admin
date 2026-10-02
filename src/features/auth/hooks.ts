import { useMutation } from '@tanstack/react-query';
import type { ChangePasswordBody, Permission, Role, UpdateProfileBody } from '@phonics/contracts';
import { useMemo } from 'react';
import { authService } from '@/features/auth/api/authService';
import { setCurrentUser, useAuthState, type AuthStatus } from '@/features/auth/authStore';
import type { UserModel } from '@/features/auth/models/UserModel';

export interface Auth {
  status: AuthStatus;
  user: UserModel | null;
  permissions: readonly Permission[];
  role: Role | null;
  isAdmin: boolean;
  /** ADMIN luôn có mọi quyền; giáo viên theo `permissions` hiệu lực từ /auth/me */
  can: (permission: Permission) => boolean;
  hasRole: (...roles: Role[]) => boolean;
}

/** Phiên đăng nhập hiện tại + helper kiểm tra quyền để ẩn / disable nút */
export function useAuth(): Auth {
  const state = useAuthState();
  return useMemo(() => {
    const role = state.user?.role ?? null;
    const isAdmin = state.user?.isAdmin ?? false;
    return {
      status: state.status,
      user: state.user,
      permissions: state.permissions,
      role,
      isAdmin,
      can: (permission) => isAdmin || state.permissions.includes(permission),
      hasRole: (...roles) => role !== null && roles.includes(role),
    };
  }, [state]);
}

export const useCan = (permission: Permission): boolean => useAuth().can(permission);

/** Sửa hồ sơ của chính mình; xong thì cập nhật user trong authStore */
export const useUpdateProfile = () =>
  useMutation({
    mutationFn: (body: UpdateProfileBody) => authService.updateProfile(body),
    onSuccess: setCurrentUser,
  });

export const useChangePassword = () =>
  useMutation({ mutationFn: (body: ChangePasswordBody) => authService.changePassword(body) });
