/**
 * Phiên đăng nhập của admin / giáo viên: user + quyền hiệu lực (từ GET /auth/me), refresh token lưu
 * localStorage (`phonics-admin:auth`). Access token nằm trong shared/api/client.
 *
 * Khởi động: có snapshot → refresh để lấy access token → /auth/me → authenticated; thất bại → anonymous.
 * Học sinh không được vào admin: đăng nhập xong thấy role STUDENT thì thu hồi phiên ngay.
 */
import { User, type LoginBody, type Permission, type Role } from '@phonics/contracts';
import { useMemo, useSyncExternalStore } from 'react';
import { z } from 'zod';
import { AuthService } from '@/features/auth/api/authService';
import { UserModel } from '@/features/auth/models/UserModel';
import {
  clearSession,
  getSession,
  refreshSession,
  SessionEventType,
  setSession,
  subscribeSession,
} from '@/shared/api/client';
import { isApiError } from '@/shared/api/errors';
import { AUTH_STORAGE_KEY } from '@/shared/config';
import { t } from '@/shared/i18n';
import { type ValueOf } from '@/shared/types';

export const AuthStatus = { LOADING: 'loading', ANONYMOUS: 'anonymous', AUTHENTICATED: 'authenticated' } as const;
export type AuthStatus = ValueOf<typeof AuthStatus>;

export interface AuthState {
  status: AuthStatus;
  user: UserModel | null;
  permissions: readonly Permission[];
}

const StoredAuth = z.object({ user: User, refreshToken: z.string().min(1) });
type StoredAuth = z.infer<typeof StoredAuth>;

const ANONYMOUS: AuthState = { status: AuthStatus.ANONYMOUS, user: null, permissions: [] };

let state: AuthState = { status: AuthStatus.LOADING, user: null, permissions: [] };
const listeners = new Set<() => void>();

function setState(next: AuthState): void {
  state = next;
  for (const listener of listeners) listener();
}

function readStorage(): { user: UserModel; refreshToken: string } | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = StoredAuth.safeParse(JSON.parse(raw));
    return parsed.success
      ? { user: new UserModel(parsed.data.user), refreshToken: parsed.data.refreshToken }
      : null;
  } catch {
    return null;
  }
}

function writeStorage(snapshot: StoredAuth | null): void {
  try {
    if (snapshot) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(snapshot));
    else localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Chế độ riêng tư / hết quota: phiên chỉ sống trong tab này
  }
}

function persist(user: UserModel): void {
  const { refreshToken } = getSession();
  writeStorage(refreshToken ? { user: user.toJSON(), refreshToken } : null);
}

function signedOut(): void {
  clearSession();
  writeStorage(null);
  setState(ANONYMOUS);
}

// Client refresh xong → lưu refresh token mới; client mất phiên → về anonymous
subscribeSession((event) => {
  if (event.type === SessionEventType.REFRESHED) {
    persist(state.user ?? new UserModel(event.auth.user));
  } else if (state.status !== AuthStatus.ANONYMOUS) {
    signedOut();
  }
});

/** Nạp user + quyền từ /auth/me vào store */
async function loadMe(): Promise<void> {
  const me = await AuthService.me();
  setState({ status: AuthStatus.AUTHENTICATED, user: me.user, permissions: me.permissions });
  persist(me.user);
}

let bootstrapPromise: Promise<void> | null = null;

/** Khôi phục phiên từ localStorage lúc khởi động (gọi một lần ở providers) */
export function bootstrapAuth(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    const stored = readStorage();
    if (!stored) {
      setState(ANONYMOUS);
      return;
    }
    setSession({ accessToken: null, refreshToken: stored.refreshToken });
    try {
      await refreshSession();
      await loadMe();
    } catch {
      signedOut();
    }
  })();
  return bootstrapPromise;
}

export class StudentNotAllowedError extends Error {
  constructor() {
    super(t.auth.studentNotAllowed);
    this.name = 'StudentNotAllowedError';
  }
}

/** Đăng nhập; học sinh bị từ chối (thu hồi phiên vừa cấp) */
export async function login(body: LoginBody): Promise<void> {
  const auth = await AuthService.login(body);
  if (auth.user.isStudent) {
    if (auth.refreshToken)
      await AuthService.logout({ refreshToken: auth.refreshToken }).catch(() => undefined);
    throw new StudentNotAllowedError();
  }
  setSession({ accessToken: auth.accessToken, refreshToken: auth.refreshToken });
  try {
    await loadMe();
  } catch (error) {
    signedOut();
    throw error;
  }
}

/** Đăng xuất thiết bị này (all = mọi thiết bị). Lỗi mạng vẫn xoá phiên cục bộ. */
export async function signOut(all = false): Promise<void> {
  const { refreshToken } = getSession();
  try {
    if (refreshToken || all)
      await AuthService.logout({ refreshToken: refreshToken ?? undefined, all: all || undefined });
  } catch (error) {
    if (!isApiError(error)) throw error;
  } finally {
    signedOut();
  }
}

/** Sau khi sửa hồ sơ: cập nhật user trong store + localStorage */
export function setCurrentUser(user: UserModel): void {
  if (state.status !== AuthStatus.AUTHENTICATED) return;
  setState({ ...state, user });
  persist(user);
}

/** Nạp lại quyền (sau khi admin đổi quyền của chính mình...) */
export const reloadMe = loadMe;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useAuthState = (): AuthState =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );

/** Dành cho test: đặt lại store */
export function resetAuthStoreForTests(): void {
  bootstrapPromise = null;
  clearSession();
  state = { status: AuthStatus.LOADING, user: null, permissions: [] };
}

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
  const current = useAuthState();
  return useMemo(() => {
    const role = current.user?.role ?? null;
    const isAdmin = current.user?.isAdmin ?? false;
    return {
      status: current.status,
      user: current.user,
      permissions: current.permissions,
      role,
      isAdmin,
      can: (permission) => isAdmin || current.permissions.includes(permission),
      hasRole: (...roles) => role !== null && roles.includes(role),
    };
  }, [current]);
}

export const useCan = (permission: Permission): boolean => useAuth().can(permission);
