import type { Permission, Role, User } from '@phonics/contracts';
import { useMemo } from 'react';
import { useAuthState, type AuthStatus } from '@/features/auth/authStore';

export interface Auth {
  status: AuthStatus;
  user: User | null;
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
    const isAdmin = role === 'ADMIN';
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
