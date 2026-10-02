/**
 * Service xác thực / hồ sơ: gọi `authRepository` rồi đổi `user` trong response → `UserModel`.
 * authStore, hook và trang chỉ gọi service.
 */
import type {
  ChangePasswordBody,
  LoginBody,
  LogoutBody,
  Permission,
  UpdateProfileBody,
} from '@phonics/contracts';
import { authRepository } from '@/features/auth/api/authRepository';
import { UserModel } from '@/features/auth/models/UserModel';

export interface LoginResult {
  accessToken: string;
  /** Chỉ có khi dùng body transport (admin luôn dùng) */
  refreshToken: string | null;
  user: UserModel;
}

export interface CurrentUser {
  user: UserModel;
  permissions: Permission[];
}

export const authService = {
  login: async (body: LoginBody): Promise<LoginResult> => {
    const auth = await authRepository.login(body);
    return {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken ?? null,
      user: new UserModel(auth.user),
    };
  },
  logout: (body: LogoutBody) => authRepository.logout(body),
  me: async (): Promise<CurrentUser> => {
    const me = await authRepository.me();
    return { user: new UserModel(me.user), permissions: me.permissions };
  },
  changePassword: (body: ChangePasswordBody) => authRepository.changePassword(body),
  updateProfile: async (body: UpdateProfileBody) => new UserModel(await authRepository.updateProfile(body)),
};
